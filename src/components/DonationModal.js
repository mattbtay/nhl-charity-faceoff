import { useState } from 'react';
import styled from 'styled-components';
import Spinner from './Spinner';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.backgroundAlt};
  padding: 2rem;
  border-radius: ${props => props.theme.borderRadius.large};
  max-width: 400px;
  width: 100%;
  box-shadow: ${props => props.theme.shadows.large};
  position: relative;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;

  img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-bottom: 1rem;
  }
`;

const Title = styled.h2`
  font-family: ${props => props.theme.fonts.heading};
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.primary};
`;

const CharityName = styled.h3`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: 0.5rem;
`;

const AmountOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1.5rem 0;
`;

const AmountButton = styled.button`
  background-color: ${props => props.$selected ? props.$teamColor || props.theme.colors.primary : props.theme.colors.background};
  color: ${props => props.$selected ? 'white' : props.theme.colors.text};
  border: 2px solid ${props => props.$teamColor || props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 0.75rem 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    background-color: ${props => props.$teamColor || props.theme.colors.primary};
    color: white;
    transform: translateY(-2px);
  }
`;

const CustomAmountContainer = styled.div`
  margin: 1.5rem 0;
`;

const CustomAmountLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${props => props.theme.colors.textLight};
`;

const CustomAmountInput = styled.div`
  display: flex;
  align-items: center;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 0.5rem 1rem;
  background: ${props => props.theme.colors.background};

  &:focus-within {
    border-color: ${props => props.$teamColor || props.theme.colors.primary};
  }

  span {
    font-weight: 600;
    margin-right: 0.5rem;
    color: ${props => props.theme.colors.textLight};
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.2rem;
    padding: 0.5rem 0;
    outline: none;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
    width: 100%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 600;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  border: 2px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  
  &:hover {
    background-color: ${props => props.theme.colors.border};
  }
`;

const DonateButton = styled(Button)`
  background-color: ${props => props.$teamColor || props.theme.colors.accent};
  color: white;
  border: none;
  
  &:hover {
    opacity: 0.9;
    box-shadow: ${props => props.theme.shadows.medium};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  
  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const predefinedAmounts = [10, 25, 50, 100, 250, 500];

const DonationModal = ({ 
  isOpen, 
  onClose, 
  team, 
  onDonate, 
  isProcessing 
}) => {
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!isOpen) return null;

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setIsCustom(true);
  };

  const handleDonate = () => {
    const finalAmount = isCustom && customAmount ? parseInt(customAmount, 10) : selectedAmount;
    
    // Validate amount
    if (finalAmount < 1) {
      alert("Please enter a valid donation amount");
      return;
    }
    
    onDonate(finalAmount);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <ModalHeader>
          <img src={team.logo} alt={`${team.name} logo`} />
          <Title>Donate to</Title>
          <CharityName>{team.charityName}</CharityName>
        </ModalHeader>
        
        <AmountOptions>
          {predefinedAmounts.map(amount => (
            <AmountButton
              key={amount}
              $selected={selectedAmount === amount && !isCustom}
              $teamColor={team.teamColor}
              onClick={() => handleAmountSelect(amount)}
            >
              ${amount}
            </AmountButton>
          ))}
        </AmountOptions>
        
        <CustomAmountContainer>
          <CustomAmountLabel>Custom Amount:</CustomAmountLabel>
          <CustomAmountInput $teamColor={team.teamColor}>
            <span>$</span>
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="Enter amount"
              inputMode="numeric"
            />
          </CustomAmountInput>
        </CustomAmountContainer>
        
        <ButtonContainer>
          <CancelButton onClick={onClose}>
            Cancel
          </CancelButton>
          <DonateButton 
            onClick={handleDonate} 
            $teamColor={team.teamColor}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Spinner color="#FFFFFF" size="1.5rem" />
            ) : (
              `Donate ${isCustom && customAmount ? `$${customAmount}` : `$${selectedAmount}`}`
            )}
          </DonateButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DonationModal; 