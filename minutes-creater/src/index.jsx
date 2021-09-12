import ForgeUI, { useState, render, Fragment, Macro, Text, Heading, ModalDialog, Form, TextArea, Strong } from "@forge/ui";
import { fetch } from "@forge/api";

const CLUSTERING_URL =
  "https://clustering.debater.res.ibm.com/api/public/clustering";
const CLAIM_DETECT_URL = "https://claim-sentence.debater.res.ibm.com/score/";

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
  const pairs = sentences.map((sentence) => [topic, sentence]);
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

  for(const item of agenda){
    const promises = [];
    for(let i = 0, len = clusters.length; i < len; ++i){
      if (selected.has(i)) {
        promises.push(Promise.resolve([-1]));
      }
      else{
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

const TIME_DESC = "Note: It will take a few minutes to this execution."
const AGENDA_DESC = "Please input each item of agenda per line.";
const TRANSCRIPTION_DESC = "Please input each sentence per line.";
const CANCEL_DESC = "The execution was cancelled. Please re-run Minutes Creator."

const App = () => {
  const [headers, setHeaders] = useState([]);
  const [clusters, setClusters] = useState([[]]);
  const [open, setOpen] = useState(true);
  const [show, setShow] = useState(true);

  const onSubmit = async (formData) => {
    setOpen(false);
    setShow(true);
    const agenda = formData.agenda.split("\n");
    setHeaders(agenda);
    const transcription = formData.transcription.split("\n");
    const clusteringResult = await clustering(transcription, agenda.length);
    const matchedClusters = await matchAgendaWithCluster(agenda, clusteringResult);
    setClusters(matchedClusters);
  };

  const onClose = () => {
    setOpen(false);
    setShow(false);
  }

  return (
    <Fragment>
      {open && (
        <ModalDialog header="Minutes Creator" onClose={onClose}>
          <Text><Strong>{TIME_DESC}</Strong></Text>
          <Form onSubmit={onSubmit} submitButtonText="Create Minutes">
            <TextArea label="Agenda Items" name="agenda" isRequired="true" description={AGENDA_DESC} />
            <TextArea label="Meeting Transcript" name="transcription" isRequired="true" description={TRANSCRIPTION_DESC} />
          </Form>
        </ModalDialog>
      )}
      {(!open && show) && (
        <Fragment>
          {clusters.map((cluster, index) => (
            <Fragment>
              <Heading>{headers[index]}</Heading>
              {cluster.map((sentence) => (
                <Text>{sentence}</Text>
              ))}
            </Fragment>
          ))}
        </Fragment>
      )}
      {!show && (
        <Text><Strong>{CANCEL_DESC}</Strong></Text>
      )}
    </Fragment>
  );
};

export const run = render(<Macro app={<App />} />);
