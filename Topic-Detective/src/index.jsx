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
  Link,
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
const autoFormattingText = (text,format) =>{
  const { convert } = require('html-to-text');
  let tmpText = ""
  let splitResult = []
  let formatResult = []

  // HTML --> Text成形
  let textResult = convert(text['body']['styled_view']['value'],{
    wordwrap: 200,
    selectors: [ 
      { selector: 'a', options: { ignoreHref: true }},
      { selector: 'img', format: 'skip' },
      { selector: 'src', format: 'skip' }
    ]  
  });

  // Text --> FillterText
  if(format.length == 1){
    if(format[0] ==='linefeed'){      
      splitResult = textResult.split('\n');
    }
    if(format[1] ==='period'){
      splitResult = textResult.split('.');
    }
    splitResult = splitResult.filter(Boolean);
  }else if(format.length == 2){
    
    format.forEach(function(el,i){
      if(el ==='linefeed'){
        if(tmpText === ""){
          splitResult = textResult.split('\n');
          splitResult = splitResult.filter(Boolean);
          tmpText = splitResult.join()
        }else{
          splitResult = tmpText.split('\n');
          splitResult = splitResult.filter(Boolean);
        } 
      }else if(el == 'period'){
        if(tmpText===""){
          splitResult = textResult.split('.');
          splitResult = splitResult.filter(Boolean);
          tmpText = splitResult.join()
        }else{
          splitResult = tmpText.split('.');
          splitResult = splitResult.filter(Boolean);
        }
      }
    })
  }
  splitResult.forEach(function(el,i){
    if(el.length < 3){
      return;
    }else{
      formatResult.push(el)
    }
  })
  return formatResult;
}

const App = () => {
  const context = useProductContext();
  const [score, setScore] = useState();
  const [isOpen, setOpen] = useState(true);
  const [relatedSentence, setRelatedSentence] = useState([]);
  const [sentencetitle, setSentenceTitle] = useState(undefined);
  const [test,testbody] = useState(undefined);
  
  const onSubmit = async (formData) => {
    const relatedsentenceList = [];
    const sententtitle = "<Related Sentences>"
    const summaryTitle = "<Summary>"

    // tpicInfo(トピック情報)
    if (formData.inputtopic === null || 
      formData.inputtopic === undefined){ 
      setRelatedSentence("null Or undefined");
      return;
    } 
    // sentenceInfo(センテンス情報)
    const contentResult = await getContentProperty(context.contentId);
    const allsentence = autoFormattingText(contentResult,formData.cuttype)
    const davaterData = getConvertText(allsentence,formData.inputtopic)
    const scoreResult = await topicScoreDebater(davaterData);
    testbody(allsentence); 
    setSentenceTitle(sententtitle);
    setScore(scoreResult)
    scoreResult.forEach(function(el,i){
      if(el >= 0.5){
        relatedsentenceList.push("・ " + allsentence[i])
      }
    })
    setRelatedSentence(relatedsentenceList.join());
  };  

  const cancel = () => {
    setSentenceTitle(undefined);
    setRelatedSentence(undefined);
    setScore(undefined);
  };
  
  const actionButtons = [<Button text="ResultClear" onClick={cancel} />,];
  if (!isOpen) {return null;}
  
  return (
    <Fragment>
      <ModalDialog header="Topic Detective" width="x-large" onClose={() => setOpen(false)}>
        <Form onSubmit={onSubmit} actionButtons={actionButtons}>
          <TextField name="inputtopic" label="Topic"/>
          <CheckboxGroup name="cuttype" label="Sentence Cut Type">
            <Checkbox defaultChecked value="period" label="Period" />
            <Checkbox defaultChecked value="linefeed" label="LineFeed" />
          </CheckboxGroup>  
        </Form>
        <Text><Strong>■Result</Strong></Text>
        <Text><Strong>{sentencetitle}</Strong></Text>
        <Text content={`${relatedSentence}`} format="markdown"/>
      </ModalDialog>
    </Fragment>
  );
};

export const run = render(
  <ContentAction>
    <App/>
  </ContentAction>
);