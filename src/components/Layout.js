import Link from 'next/link';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  max-width: ${props => props.theme.breakpoints.xl};
  margin: 0 auto;
  padding: 3rem 2rem;
  width: 100%;
`;

const Footer = styled.footer`
  background-color: transparent;
  color: ${props => props.theme.colors.textLight};
  padding: 1.5rem 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: ${props => props.theme.breakpoints.xl};
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.7;
`;

const Layout = ({ children }) => {
  return (
    <Container>
      <Main>{children}</Main>
      <Footer>
        <FooterContent>
          <p>made with ❤️ by Matt and Brayden</p>
        </FooterContent>
      </Footer>
    </Container>
  );
};

export default Layout; 