import ForgeUI, {
  useState,
  useConfig,
  useProductContext,
  render,
  Fragment,
  Macro,
  MacroConfig,
  Button,
  Text,
  Heading,
  TextArea,
  Strong
} from "@forge/ui";
import { fetch, storage } from "@forge/api";

import { createHash } from 'crypto'

const CLUSTERING_URL =
  "https://clustering.debater.res.ibm.com/api/public/clustering";
const CLAIM_DETECT_URL = "https://claim-sentence.debater.res.ibm.com/score/";
const PROCON_URL = "https://pro-con.debater.res.ibm.com/score/";

const debaterFetch = async (url, body) => {
  const response = await fetch(url, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      apiKey: process.env.DEBATER_API_KEY,
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

const clustering = async (sentences, clusterNum) => {
  const body = {
    text_preprocessing: ["stemming"],
    embedding_method: "tf",
    clustering_method: "sib",
    num_of_clusters: clusterNum,
    arguments: sentences,
  };
  const json = await debaterFetch(CLUSTERING_URL, body);
  const result = json.arguments_id_and_distance_per_cluster;

  const clusters = result.map((elem) => {
    return elem.argumentInfoContainers.map(
      (argument) => sentences[argument.argument_id]
    );
  });

  return clusters;
};

const claimDetect = async (topic, sentences) => {
  const pairs = sentences.map((sentence) => [sentence, topic]);
  const body = {
    "sentence_topic_pairs": pairs
  };
  const result = await debaterFetch(CLAIM_DETECT_URL, body);

  return result;
};

const average = (array) => {
  return array.reduce((i, j) => (i + j)) / array.length;
}

const matchAgendaWithCluster = async (agenda, clusters) => {
  const newClusters = [];
  const selected = new Set();

  for (const item of agenda) {
    const promises = [];
    for (let i = 0, len = clusters.length; i < len; ++i) {
      if (selected.has(i)) {
        promises.push(Promise.resolve([-1]));
      }
      else {
        promises.push(claimDetect(item, clusters[i]));
      }
    }

    let bestScore = 0;
    let bestIndex = 0;
    const scores = await Promise.all(promises);
    scores.forEach((score, index) => {
      const scoreAVG = average(score);
      if (bestScore < scoreAVG) {
        bestScore = scoreAVG;
        bestIndex = index;
      }
    });

    newClusters.push(clusters[bestIndex]);
    selected.add(bestIndex);
  }

  return newClusters;
}

const procon = async (topics, matchedClusters) => {
  const pairs = [];
  topics.forEach((topic, index) => {
    matchedClusters[index].forEach(sentence => {
      pairs.push([sentence, topic]);
    })
  })
  const body = {
    "sentence_topic_pairs": pairs
  };
  const result = await debaterFetch(PROCON_URL, body);

  return result;
}

const TIME_DESC = "Note: It often takes a long time to the execution which overs 10 seconds run time limit of forge."
const AGENDA_DESC = "Please input each item of agenda per line.";
const TRANSCRIPTION_DESC = "Please input each sentence per line.";
const CONFIG_DESC = "Configurations aren't set. It's necessary to configure this macro.";

const App = () => {
  const config = useConfig();
  const context = useProductContext();

  const [headers, setHeaders] = useState([]);
  const [clusters, setClusters] = useState([[]]);
  const [agree, setAgree] = useState([]);


  const [stored, setStored] = useState(
    async () => {
      if (!config) return {};
      const storedData = await getStoredData(context, config);
      if (storedData) {
        setHeaders(storedData.headers);
        setClusters(storedData.clusters);
        setAgree(storedData.agree);
        return storedData;
      }
      else {
        return {};
      }
    }
  )

  const [showCreate, setShowCreate] = useState(async () => {
    if (config) {
      const stored = await isStored(context, config)
      return !stored;
    }
    return true;
  });
  const [showDraft, setShowDraft] = useState(async () => {
    if (config) return await isStored(context, config);
    return false;
  });
  const [showSave, setShowSave] = useState(false);
  const [showConfigDesc, setShowConfigDesc] = useState(false);

  const onClickCreate = async () => {
    if (isConfigured(config)) {
      const agenda = config.agenda.split("\n");
      setHeaders(agenda);

      const transcription = config.transcription.split("\n");
      const clusteringResult = await clustering(transcription, agenda.length);

      const matchedClusters = await matchAgendaWithCluster(agenda, clusteringResult);
      setClusters(matchedClusters);

      const proconResult = await procon(agenda, matchedClusters);
      setAgree(
        proconResult.map(polarityDetect)
      );
      setShowCreate(false);
      setShowDraft(true);
      setShowSave(true);
    }
    else {
      setShowConfigDesc(true);
    }
  };

  const onClickSave = async () => {
    await storeData(context, config, {
      headers: headers,
      clusters: clusters,
      agree: agree
    });
    setShowSave(false);
  }

  return (
    <Fragment>
      {showCreate && (
        <Fragment>
          <Button
            text="Create Minutes"
            icon="vid-play"
            onClick={onClickCreate}
          />
          <Text>{TIME_DESC}</Text>
        </Fragment>
      )}
      {showDraft && (
        <Fragment>
          {clusters.map((cluster, cindex) => (
            <Fragment>
              <Heading>{headers[cindex]}</Heading>
              {cluster.map((sentence, sindex) => (
                <Text>{polarityMark(agree, clusters, cindex, sindex)} {sentence}</Text>
              ))}
            </Fragment>
          ))}
        </Fragment>
      )}
      {showSave && (
        <Button
          text="Save Minutes"
          icon="file"
          onClick={onClickSave}
        />
      )}
      {showConfigDesc && (
        <Text><Strong>{CONFIG_DESC}</Strong></Text>
      )}
    </Fragment>
  );
};

const isConfigured = (config) => {
  return config && config.agenda !== ""
    && config.transcription !== "";
}

const storeKey = (context, config) => {
  return encryptSha256(
    context.contentId
    + config.agenda
    + config.transcription
  );
}

const encryptSha256 = (str) => {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex')
}

const getStoredData = async (context, config) => {
  if (config) {
    const key = storeKey(context, config);
    const storedData = await storage.get(key);
    return storedData;
  }
  return undefined;
}

const storeData = async (context, config, obj) => {
  if (config) {
    const key = storeKey(context, config);
    return storage.set(key, obj);
  }
}

const isStored = async (context, config) => {
  const storedData = await getStoredData(context, config);
  return storedData !== void 0;
}

const polarityDetect = (result) => {
  let bigger = (result.pro > result.con) ? "pro" : "con";
  if (result[bigger] < result["neutral"]) {
    bigger = "neutral";
  }
  return bigger;
}

const AGREE_MARKER = "0x1F642";
const DISAGREE_MARKER = "0x1F914";
const NEUTRAL_MARKER = "0xE0020";

const polarityMark = (agree, clusters, cIndex, sIndex) => {
  let index = sIndex;
  for (let i = 0; i < cIndex; ++i) {
    index += clusters[i].length;
  }
  let marker;
  switch (agree[index]) {
    case "pro": marker = AGREE_MARKER; break;
    case "con": marker = DISAGREE_MARKER; break;
    default: marker = NEUTRAL_MARKER;
  }
  return String.fromCodePoint(marker);
}

export const run = render(<Macro app={<App />} />);

const Config = () => {
  return (
    <MacroConfig>
      <TextArea
        label="Agenda Items"
        name="agenda"
        description={AGENDA_DESC}
        defaultValue=""
        isRequired="true" />
      <TextArea
        label="Meeting Transcript"
        name="transcription"
        description={TRANSCRIPTION_DESC}
        defaultValue=""
        isRequired="true" />
    </MacroConfig>
  );
};

export const config = render(<Config />);
