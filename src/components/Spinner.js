import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: inline-block;
  width: 24px;
  height: 24px;
`;

const SpinnerCircle = styled.div`
  width: 100%;
  height: 100%;
  border: 2px solid ${props => props.theme.colors.backgroundAlt};
  border-top-color: ${props => props.color || props.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const Spinner = ({ color }) => (
  <SpinnerContainer>
    <SpinnerCircle color={color} />
  </SpinnerContainer>
);

export default Spinner; 