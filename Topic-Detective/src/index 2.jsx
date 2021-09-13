import api, { route,fetch } from "@forge/api";
import ForgeUI, { 
  render,
  Button,
  Form,
  Fragment,
  TextField,
  CheckboxGroup,
  Checkbox,
  useState,
  Text,
  Strong,
  ContentAction ,
  ModalDialog,
  useProductContext,
} from "@forge/ui";

const ARGUMENT_QUALITY_URL = "https://arg-quality.debater.res.ibm.com/score/";

// IBM ls Quilty analysis Function
const topicScoreDebater = async (sentences) => {
  const body = {
    "sentence_topic_pairs": sentences
  }
  const res = await fetch(ARGUMENT_QUALITY_URL,{
    method: "post",
    headers:{
      'apiKey': process.env.DEBATER_API_KEY,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(body)
  })
  return await res.json();
};

//Atlassian Rest API 
const getContentProperty = async(contentId) => {
  const res = await api
    .asApp()
    .requestConfluence(route`/wiki/rest/api/content/${contentId}?expand=body.styled_view`,{
      headers: {
        'Accept': 'application/json'
      }
  });
  return await res.json();
};

// Quilty analysis Function Body DataSet
const getConvertText = (format,sentence) =>{
  const topicAndSentenceList = []
  format.forEach(function(el,i){
    const topicTmp = [];
    if(!(el == ' '|| el == '　'　|| el.length < 2)){
      topicTmp.push(sentence);
      topicTmp.push(el);
      topicAndSentenceList.push(topicTmp);
    }
  });
  return topicAndSentenceList;
} 

// Json成形関数
const autoFormattingText = (text) =>{
  const { convert } = require('html-to-text');
  let tmpText = ""
  let splitResult = []
  let formatResult = []
  let fillterResult = []
  let periodFillterResult = []
  let periodSplitResult = []
  // HTML --> Text成形
  let textResult = convert(text['body']['styled_view']['value'],{
    wordwrap: 100000,
    selectors: [ 
      { selector: 'a', options: { ignoreHref: true }},
      { selector: 'img', format: 'skip' },
      { selector: 'src', format: 'skip' }
    ]  
  });

  // linefeed
  fillterResult = textResult.split('\n')
  splitResult = fillterResult.filter(Boolean);
  tmpText = splitResult.join('.')

  // period
  periodFillterResult = tmpText.split('.');
  periodSplitResult = periodFillterResult.filter(Boolean);
  periodSplitResult.forEach(function(el,i){
    if(el.length < 3){
      return;
    }else{
      formatResult.push(el + ".")
    }
  })
  return formatResult;
}

const App = () => {
  const context = useProductContext();
  const [score, setScore] = useState();
  const [isOpen, setOpen] = useState(true);
  const [relatedSentence, setRelatedSentence] = useState([]);
  const [inputtopic, setInputTopic] = useState();
  const [outsentent,setOutSentent] = useState();
  let compflg =false;
  const onSubmit = async (formData) => {
  const relatedsentenceList = [];

  // topicInfo
    if (formData.inputtopic ==="" || formData.inputtopic === null || formData.inputtopic === undefined){ 
      setInputTopic('');
      setOutSentent('');
      relatedsentenceList.push("Input：Empty")
      setRelatedSentence(relatedsentenceList);
      return;
    } 
    setInputTopic("Input：" + formData.inputtopic);

    // sentenceInfo
    const contentResult = await getContentProperty(context.contentId);
    const allsentence = autoFormattingText(contentResult)
    const davaterData = getConvertText(allsentence,formData.inputtopic)
    const scoreResult = await topicScoreDebater(davaterData);
    setScore(scoreResult)

    scoreResult.forEach(function(el,i){
      if(el >= 0.65){
        relatedsentenceList.push("・ " + allsentence[i])
        compflg = true;
      }
    })
    if(compflg===false){
      relatedsentenceList.push("No Relevant Sentence");
      setOutSentent("Output：")
      setRelatedSentence(relatedsentenceList);
      return
    }
    setOutSentent("Output：")
    setRelatedSentence(relatedsentenceList);
  };  

  const cancel = () => {
    setInputTopic('');
    setOutSentent('');
    setRelatedSentence([]);
    setScore(undefined);
  };
  
  const actionButtons = [<Button text="ResultClear" onClick={cancel} />,];
  if (!isOpen) {return null;}
  
  return (
    <Fragment>
      <ModalDialog header="Topic Detective" width="x-large" onClose={() => setOpen(false)}>
        <Form onSubmit={onSubmit} actionButtons={actionButtons}>
          <TextField name="inputtopic" label="Topic"/>
        </Form>
        <Text><Strong>■Result</Strong></Text>
        <Text><Strong>{inputtopic}</Strong></Text>
        <Text><Strong>{outsentent}</Strong></Text>
        <Fragment>
          { relatedSentence && relatedSentence.map((element) => (
              <Text>{element}</Text>
            ))
          }
        </Fragment>
    </ModalDialog>
    </Fragment>
  );
};

export const run = render(
  <ContentAction>
    <App/>
  </ContentAction>
);