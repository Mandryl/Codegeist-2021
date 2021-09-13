import {NextPage} from "next";
import {MouseEventHandler, useCallback, useState} from "react";
import {
    KeyPointAnalysisResult,
    PostExecutionRequest,
    PostExecutionResponse,
    PostExecutionStatusRequest,
    PostExecutionStatusResponse
} from "../interface/execution.interface";
import axios from "axios";
import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";

const BASE_PATH = "https://9py6zff7q2.execute-api.ap-northeast-1.amazonaws.com/dev"

const Summary: NextPage = () => {
    const [inputText, setInputText] = useState("")
    const [executionArn, setExecutionArn] = useState("")
    const [result, setResult] = useState("")
    const [apiKey, setApiKey] = useState("")

    const handleSummarize: MouseEventHandler = useCallback(async (event) => {
        if (inputText === "") {
            alert("Please input text.")
            return
        }
        if (executionArn !== "") {
            alert("Please show result.")
            return
        }

        const texts: string[] = inputText.split(". ").map(value => `${value}.`)
        const request: PostExecutionRequest = {
            texts: texts
        }
        const {data} = await axios.post<PostExecutionResponse>(
            `${BASE_PATH}/execution`,
            request,
            {
                headers: {"x-api-key": apiKey}
            }
        )
        console.log(data)
        setExecutionArn(data.executionArn)

        alert("Success start summarizing! Please wait a minute.")
    }, [inputText]);

    const handleShowResult: MouseEventHandler = useCallback(async (event) => {
        if (executionArn === "") {
            alert("Please summarize in advance before executing.")
            return
        }

        const request: PostExecutionStatusRequest = {
            executionArn: executionArn
        }
        const {data} = await axios.post<PostExecutionStatusResponse>(
            `${BASE_PATH}/execution/status`,
            request,
            {
                headers: {"x-api-key": apiKey}
            }
        )
        console.log(data)
        if (data.status == "RUNNING") {
            alert("Summarizing now. Please wait a minute.")
            return
        } else if (data.status == "SUCCEEDED") {
            const body: KeyPointAnalysisResult = JSON.parse(data.output.body)
            setResult(body.keypoint_matchings
                .filter(kp => kp.keypoint !== "none")
                .map(kp => kp.keypoint)
                .join("\n"))
        }
        setExecutionArn("")
    }, [executionArn]);

    return (
        <>
            <Container>
                <div className="d-grid gap-3">
                    <Card>
                        <Card.Header>Usage</Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Step 1. Input your texts to be summarized in left text area.
                            </Card.Text>
                            <Card.Text>
                                Step 2. Click Summarize button.
                            </Card.Text>
                            <Card.Text>
                                Step 3. Wait.
                            </Card.Text>
                            <Card.Text>
                                Step 4. After a while, click Show result button.
                            </Card.Text>
                            <Card.Text>
                                Step 5. Check summary !
                            </Card.Text>
                        </Card.Body>
                    </Card>

                    <Form.Control type="text" placeholder="Text Summarizer API key"
                                  onChange={event => setApiKey(event.target.value)}/>

                    <Row>
                        <Col>
                            <div className="d-grid gap-3">
                                <Form.Control as="textarea" placeholder="Text to be summarized"
                                              style={{height: '300px'}}
                                              onChange={event => setInputText(event.target.value)}/>
                                <Button variant="primary"
                                        onClick={handleSummarize}>Summarize</Button>
                            </div>
                        </Col>
                        <Col>
                            <div className="d-grid gap-3">
                                <Form.Control as="textarea" placeholder="Summary" readOnly
                                              value={result} style={{height: '300px'}}/>
                                <Button variant="primary" onClick={handleShowResult}>Show
                                    result</Button>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>
        </>
    )
}

export default Summary;
