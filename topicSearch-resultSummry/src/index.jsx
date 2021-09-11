import api, { route,fetch } from "@forge/api";
import ForgeUI, { 
  render,
  Button,
  Form,
  Fragment,
  TextArea,
  CheckboxGroup,
  Checkbox,
  useState,
  Text,
  ContentAction ,
  ModalDialog,
  useProductContext,
} from "@forge/ui";

const ARGUMENT_QUALITY_URL = "https://arg-quality.debater.res.ibm.com/score";

// IBM Dabater Quilty analysis Function
const topicScoreDebater = async (sentences) => {
  const body = {
    "sentence_topic_pairs": sentences
  }
  const res = await fetch(SCORE_URL,{
    method: "post",
    body: JSON.stringify(body),
    header:{
      'apikey': process.env.DEBATER_API_KEY,
      "Content-Type":"application/json"
    },
  }).json();
  return await res.json();
};

// AWS API Gateway(Key Point Analysis) 未実装
/*
const getTopicSummryDebater = async (sentences) => {
  const body = {
    "sentence_topic_pairs": sentences
  }
  const res = await fetch(xxxxxxx,{
    method: "post",
    body: JSON.stringify(body),
    header:{
      'apikey': process.env.AMAZON_API_KEY,
      "Content-Type":"application/json"
    },
  }).json();
  return await res.json();
};
*/

/*  Atlassian Rest API 
https://developer.atlassian.com/cloud/confluence/rest/api-group-content/#api-wiki-rest-api-content-get */
const getContentProperty = async (contentId) => {
  const res = await api
    .asApp()
    .requestConfluence(route`/wiki/rest/api/content/${contentId}?expand=body.dynamic`,{
      headers: {
        'Accept': 'application/json'
      }
  });
  console.log(`Response: ${res.status} ${res.statusText}`);
  console.log(await res.json());
  return await res.json();
};

// Json整形関数
const autoFormattingJson = (resJson) =>{
  const arrayResult = {};
  resJson.results.forEach((obj)=> {
    arrayResult[obj.date] = obj;
  });
}

const App = () => {
  const context = useProductContext();
  const [isOpen, setOpen] = useState(true)

  const [textAleaClearString, setClearString] = useState(undefined);
  const [result, resultList] = useState(undefined);  
  const [scorejson,scoreJson] = useState(undefined);

  const [contentlist, getContent] = useState(async () => await getContentProperty(context.contentId));
  // const [json] = useState(
  //   async () => await getContentProperty(testJson)
  // );

  if (!isOpen) {
    return null;
  }
  
  // Inputデータの入力箇所
  const onSubmit = async (formData) => {
    // Topic 
    const strConvertTopic = formData.inputsentence.toString();    
    resultList(contentlist);
  };

  const cancel = () => {};


  const actionButtons = [
    <Button text="Cancel" onClick={cancel} />,
  ];

  return (
    <Fragment>
      <ModalDialog header="Sentence evaluation" onClose={() => setOpen(false)}>
        <Form onSubmit={onSubmit} actionButtons={actionButtons}>
          <TextArea name="inputsentence" label="input sentence" defaultValue={textAleaClearString}/>
          <CheckboxGroup name="products" label="Products">
            <Checkbox defaultChecked value="period" label="period" />
            <Checkbox value="Line Feed" label="Line Feed" />
          </CheckboxGroup>  
        </Form>
        <Text>{JSON.stringify(result)}</Text>
      </ModalDialog>
    </Fragment>
  );
};

export const run = render(
  <ContentAction>
    <App/>
  </ContentAction>
);