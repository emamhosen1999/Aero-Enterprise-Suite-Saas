import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
  Divider,
  Chip,
  Code,
  Card,
  CardBody
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  DocumentTextIcon,
  CubeIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const DeployContractModal = ({ 
  isOpen, 
  onClose, 
  onDeploy,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    network: '',
    contractType: '',
    bytecode: '',
    abi: '',
    constructorArgs: '',
    gasLimit: '3000000',
    gasPrice: '20',
    verified: false
  });
  
  const [errors, setErrors] = useState({});

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Network options
  const networks = [
    { key: 'ethereum', label: 'Ethereum Mainnet' },
    { key: 'polygon', label: 'Polygon' },
    { key: 'bsc', label: 'Binance Smart Chain' },
    { key: 'avalanche', label: 'Avalanche' },
    { key: 'goerli', label: 'Goerli Testnet' },
    { key: 'sepolia', label: 'Sepolia Testnet' }
  ];

  // Contract type options
  const contractTypes = [
    { key: 'erc20', label: 'ERC-20 Token' },
    { key: 'erc721', label: 'ERC-721 NFT' },
    { key: 'erc1155', label: 'ERC-1155 Multi-Token' },
    { key: 'defi', label: 'DeFi Protocol' },
    { key: 'dao', label: 'DAO Governance' },
    { key: 'custom', label: 'Custom Contract' }
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate JSON
  const isValidJson = (str) => {
    if (!str) return true;
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Validate bytecode (basic hex check)
  const isValidBytecode = (str) => {
    if (!str) return false;
    return /^(0x)?[0-9a-fA-F]+$/.test(str);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contract name is required';
    }

    if (!formData.network) {
      newErrors.network = 'Please select a network';
    }

    if (!formData.contractType) {
      newErrors.contractType = 'Please select a contract type';
    }

    if (!formData.bytecode.trim()) {
      newErrors.bytecode = 'Contract bytecode is required';
    } else if (!isValidBytecode(formData.bytecode)) {
      newErrors.bytecode = 'Invalid bytecode format. Must be valid hexadecimal';
    }

    if (formData.abi && !isValidJson(formData.abi)) {
      newErrors.abi = 'ABI must be valid JSON';
    }

    if (formData.constructorArgs && !isValidJson(formData.constructorArgs)) {
      newErrors.constructorArgs = 'Constructor arguments must be valid JSON array';
    }

    if (!formData.gasLimit || parseFloat(formData.gasLimit) <= 0) {
      newErrors.gasLimit = 'Gas limit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Estimate deployment cost
  const estimatedCost = useMemo(() => {
    if (formData.gasLimit && formData.gasPrice) {
      const cost = (parseFloat(formData.gasLimit) * parseFloat(formData.gasPrice)) / 1000000000;
      return cost.toFixed(6);
    }
    return null;
  }, [formData.gasLimit, formData.gasPrice]);

  // Handle form submission
  const handleDeploy = async () => {
    if (!validateForm()) return;

    const deployData = {
      ...formData,
      abi: formData.abi ? JSON.parse(formData.abi) : null,
      constructorArgs: formData.constructorArgs ? JSON.parse(formData.constructorArgs) : [],
      estimatedCost
    };

    try {
      await onDeploy(deployData);
      handleClose();
    } catch (error) {
      console.error('Error deploying contract:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      name: '',
      network: '',
      contractType: '',
      bytecode: '',
      abi: '',
      constructorArgs: '',
      gasLimit: '3000000',
      gasPrice: '20',
      verified: false
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={!loading}
      isKeyboardDismissDisabled={loading}
      classNames={{
        base: "bg-content1",
        header: "border-b border-divider",
        body: "py-6",
        footer: "border-t border-divider"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <CodeBracketIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Deploy Smart Contract</h2>
              <p className="text-sm text-default-500">Deploy a new smart contract to the blockchain</p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contract Name"
                placeholder="MyContract"
                value={formData.name}
                onValueChange={(value) => handleInputChange('name', value)}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                isRequired
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Select
                label="Network"
                placeholder="Select network"
                selectedKeys={formData.network ? [formData.network] : []}
                onSelectionChange={(keys) => handleInputChange('network', Array.from(keys)[0] || '')}
                isInvalid={!!errors.network}
                errorMessage={errors.network}
                isRequired
                radius={themeRadius}
                classNames={{ trigger: "bg-default-100" }}
                startContent={<CubeIcon className="w-4 h-4 text-default-400" />}
              >
                {networks.map((network) => (
                  <SelectItem key={network.key}>{network.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Contract Type"
                placeholder="Select type"
                selectedKeys={formData.contractType ? [formData.contractType] : []}
                onSelectionChange={(keys) => handleInputChange('contractType', Array.from(keys)[0] || '')}
                isInvalid={!!errors.contractType}
                errorMessage={errors.contractType}
                isRequired
                radius={themeRadius}
                classNames={{ trigger: "bg-default-100" }}
              >
                {contractTypes.map((type) => (
                  <SelectItem key={type.key}>{type.label}</SelectItem>
                ))}
              </Select>
            </div>

            <Divider />

            {/* Contract Code */}
            <Textarea
              label="Contract Bytecode"
              placeholder="0x..."
              value={formData.bytecode}
              onValueChange={(value) => handleInputChange('bytecode', value)}
              isInvalid={!!errors.bytecode}
              errorMessage={errors.bytecode}
              isRequired
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              minRows={4}
              maxRows={8}
              description="The compiled bytecode of your smart contract"
            />

            <Textarea
              label="Contract ABI (Optional)"
              placeholder='[{"type":"function","name":"transfer",...}]'
              value={formData.abi}
              onValueChange={(value) => handleInputChange('abi', value)}
              isInvalid={!!errors.abi}
              errorMessage={errors.abi}
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              minRows={4}
              maxRows={8}
              description="The ABI (Application Binary Interface) in JSON format"
            />

            <Textarea
              label="Constructor Arguments (Optional)"
              placeholder='["arg1", 100, "0x..."]'
              value={formData.constructorArgs}
              onValueChange={(value) => handleInputChange('constructorArgs', value)}
              isInvalid={!!errors.constructorArgs}
              errorMessage={errors.constructorArgs}
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              minRows={2}
              description="Constructor arguments as a JSON array"
            />

            <Divider />

            {/* Gas Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gas Limit"
                placeholder="3000000"
                value={formData.gasLimit}
                onValueChange={(value) => handleInputChange('gasLimit', value)}
                isInvalid={!!errors.gasLimit}
                errorMessage={errors.gasLimit}
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
                description="Maximum gas for deployment"
              />
              <Input
                label="Gas Price (Gwei)"
                placeholder="20"
                value={formData.gasPrice}
                onValueChange={(value) => handleInputChange('gasPrice', value)}
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
                description="Price per gas unit"
              />
            </div>

            {/* Verification Option */}
            <div className="flex items-center justify-between p-4 bg-content2 rounded-lg">
              <div>
                <p className="font-medium">Verify Contract on Explorer</p>
                <p className="text-sm text-default-500">Automatically verify source code after deployment</p>
              </div>
              <Switch
                isSelected={formData.verified}
                onValueChange={(value) => handleInputChange('verified', value)}
                color="primary"
              />
            </div>

            {/* Cost Estimate */}
            {estimatedCost && (
              <Card>
                <CardBody className="flex flex-row justify-between items-center p-4">
                  <div>
                    <p className="text-sm text-default-500">Estimated Deployment Cost</p>
                    <p className="text-lg font-bold">{estimatedCost} ETH</p>
                  </div>
                  <Chip color="primary" variant="flat">
                    Gas: {parseFloat(formData.gasLimit).toLocaleString()}
                  </Chip>
                </CardBody>
              </Card>
            )}

            {/* Warning */}
            <div className="p-4 bg-warning-50 border-l-4 border-warning rounded-r-lg">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 shrink-0" />
                <div>
                  <p className="text-sm text-warning-800 font-medium">Deployment Warning</p>
                  <p className="text-sm text-warning-700 mt-1">
                    Smart contract deployment is irreversible. Ensure your code is thoroughly tested and audited before deploying to mainnet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={loading} radius={themeRadius}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleDeploy}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <DocumentTextIcon className="w-4 h-4" /> : null}
          >
            {loading ? 'Deploying...' : 'Deploy Contract'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeployContractModal;