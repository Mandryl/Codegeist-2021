import ForgeUI, { useState, render, Fragment, Macro, Text, Heading } from "@forge/ui";
import { fetch } from "@forge/api";

const CLUSTER_NUM = 2;
const CLUSTERING_URL =
  "https://clustering.debater.res.ibm.com/api/public/clustering";

const clustering = async (sentences) => {
  const body = {
    text_preprocessing: ["stemming"],
    embedding_method: "tf",
    clustering_method: "sib",
    num_of_clusters: CLUSTER_NUM,
    arguments: sentences,
  };
  const response = await fetch(CLUSTERING_URL, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      apiKey: process.env.DEBATER_API_KEY,
      "Content-Type": "application/json",
    },
  });


  const json = await response.json();
  const result =  json.arguments_id_and_distance_per_cluster;


  const clusters = result.map((elem) => {
    return elem.argumentInfoContainers.map(
      (argument) => sentences[argument.argument_id]
    );
  });

  return clusters;
};

const App = () => {
  const script = [
    "The cat (Felis catus) is a small carnivorous mammal",
    "The origin of the domestic dog includes the dogs evolutionary divergence from the wolf",
    "As of 2017, the domestic cat was the second-most popular pet in the U.S.",
    "Domestic dogs have been selectively bred for millennia for various behaviors, sensory capabilities, and physical attributes.",
    "Cats are similar in anatomy to the other felid species",
    "Dogs are highly variable in height and weight.",
  ];

  /*
  const [json] = useState(async () => await clustering(script));
  */

  const [clusters] = useState(async () => await clustering(script));

  // return (
  //   <Text>{JSON.stringify(json)}</Text>
  // );

  return (
    <Fragment>
      {clusters.map((cluster, index) => (
        <Fragment>
          <Heading>Agenda {index}</Heading>
          {cluster.map((sentence) => (
            <Text>{sentence}</Text>
          ))}
        </Fragment>
      ))}
    </Fragment>
  );
};

export const run = render(<Macro app={<App />} />);
