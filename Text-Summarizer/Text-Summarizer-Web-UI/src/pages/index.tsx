import {NextPage} from "next";
import Summary from "./input";
import {Container, Image, Navbar} from "react-bootstrap";

const Home: NextPage = () => {
    return (
        <div className="d-grid gap-3">
            <Navbar collapseOnSelect bg="dark" variant="dark">
                <Container>
                    <Navbar.Brand href="#home">
                        Doclerk Text Summarizer
                    </Navbar.Brand>
                </Container>
            </Navbar>
            <Summary/>
        </div>
    )
}

export default Home;
