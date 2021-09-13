import ForgeUI, { render, Link,Text, ContentAction, ModalDialog, useState } from '@forge/ui';
import { invoke } from '@forge/bridge';

const App = () => {
  const [isOpen, setOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalDialog header="Text Summarizer" onClose={() => setOpen(false)}>
     <Text> 
       <Link href="https://d1poengx6x8rto.cloudfront.net/" openNewTab="true">Go to Text Summarizer(External Link)</Link>
      </Text>
    </ModalDialog>
  );
};

export const run = render(
  <ContentAction>
    <App/>
  </ContentAction>
);
