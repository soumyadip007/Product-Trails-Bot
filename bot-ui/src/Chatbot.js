// src/Chatbot.js
import React, { useState } from 'react';
import {
  Page,
  PageSection,
  TextInput,
  Button,
  Spinner,
  Stack,
  StackItem,
  Bullseye,
  Panel, PanelMain, PanelMainBody,
  Skeleton,
  Title
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import '@patternfly/react-core/dist/styles/base.css';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(''); // Declare the input state to capture the text input
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages([...messages, userMessage]);
    setInput(''); // Clear the input field after sending the message
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setTyping(true);
    }, 500);

    const response = await fetch('http://localhost:5000/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: input }),
    });

    const responseData = await response.json();
    setTyping(false);
    console.log(responseData);
    const botMessage = { text: responseData.response, sender: 'bot' };
    setMessages([...messages, userMessage, botMessage]);
  };

  const handleInputChange = (event) => {
    setInput(event.target.value); // Update input state with the new value
  };

  return (
    <Page>
      <PageSection>
        <Stack>
          <StackItem isFilled className="messages-container">
            <Title headingLevel="h1" className='trial-title'>Red Hat Product Trial Support</Title>
            <Panel isScrollable variant='secondary' className='chat-panel'>
              <PanelMain>
                <PanelMainBody>
                  {messages.map((message, index) => (
                    <div key={index} className={css('message', message.sender === 'user' ? 'user-message' : 'bot-message')}>
                      {message.text}
                    </div>
                  ))}
                  {loading && (
                    <Bullseye>
                      <Spinner size="lg" />
                    </Bullseye>
                  )}
                  {typing && (<>
                    <p className="typing-indicator">Typing...</p>
                    <Skeleton fontSize='sm' width='80%' className='skeleton'></Skeleton>
                    <Skeleton fontSize='sm' width='80%' className='skeleton'></Skeleton>
                    <Skeleton fontSize='sm' width='80%' className='skeleton'></Skeleton>
                    </>
                  )}
                </PanelMainBody>
              </PanelMain>
            </Panel>

          </StackItem>
          <StackItem className='chat-input'>
            {/* Controlled input component */}
            <TextInput
              value={input}  // This is the controlled value
              onChange={handleInputChange}  // Update the state when input changes
              placeholder="Type your message here..."
              
            />
            <Button onClick={sendMessage} variant="primary">
              Send
            </Button>
          </StackItem>
        </Stack>
      </PageSection>
    </Page>
  );
};

export default Chatbot;
