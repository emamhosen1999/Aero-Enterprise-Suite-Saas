import React, { useState, useMemo, useEffect } from 'react';
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
  Card,
  CardBody,
  Divider
} from "@heroui/react";
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';
import {
  ArrowsRightLeftIcon,
  WalletIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const TokenTransferModal = ({ 
  isOpen, 
  onClose, 
  token = null,
  wallets = [],
  onTransfer,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    fromWallet: '',
    toAddress: '',
    amount: '',
    gasLimit: '65000',
    gasPrice: '20'
  });
  
  const [errors, setErrors] = useState({});
  const [estimatedFee, setEstimatedFee] = useState(null);

  // Theme radius helper
  const themeRadius = useThemeRadius();

  // Get selected wallet details
  const selectedWallet = useMemo(() => {
    return wallets.find(wallet => wallet.id === formData.fromWallet);
  }, [wallets, formData.fromWallet]);

  // Get token balance for selected wallet
  const tokenBalance = useMemo(() => {
    if (!selectedWallet || !token) return '0.00';
    return selectedWallet.tokenBalances?.[token.symbol] || token.balance || '0.00';
  }, [selectedWallet, token]);

  // Calculate estimated fee
  useEffect(() => {
    if (formData.gasLimit && formData.gasPrice) {
      const gasFee = (parseFloat(formData.gasLimit) * parseFloat(formData.gasPrice)) / 1000000000;
      setEstimatedFee(gasFee.toFixed(6));
    } else {
      setEstimatedFee(null);
    }
  }, [formData.gasLimit, formData.gasPrice]);

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromWallet) {
      newErrors.fromWallet = 'Please select a wallet';
    }

    if (!formData.toAddress.trim()) {
      newErrors.toAddress = 'Recipient address is required';
    } else if (formData.toAddress.length < 10) {
      newErrors.toAddress = 'Please enter a valid wallet address';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(formData.amount) > parseFloat(tokenBalance)) {
      newErrors.amount = 'Insufficient token balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleTransfer = async () => {
    if (!validateForm()) return;

    const transferData = {
      ...formData,
      tokenAddress: token?.address,
      tokenSymbol: token?.symbol,
      tokenName: token?.name,
      estimatedFee,
      walletAddress: selectedWallet?.address
    };

    try {
      await onTransfer(transferData);
      handleClose();
    } catch (error) {
      console.error('Error transferring token:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      fromWallet: '',
      toAddress: '',
      amount: '',
      gasLimit: '65000',
      gasPrice: '20'
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
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
              <ArrowsRightLeftIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Transfer {token?.symbol || 'Token'}</h2>
              <p className="text-sm text-default-500">
                {token?.name || 'Unknown Token'}
              </p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Token Info */}
            {token && (
              <Card>
                <CardBody className="flex flex-row items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">{token.symbol?.substring(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{token.name}</p>
                    <p className="text-sm text-default-500">{token.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-default-500">Available Balance</p>
                    <p className="font-semibold">{tokenBalance} {token.symbol}</p>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* From Wallet */}
            <Select
              label="From Wallet"
              placeholder="Select your wallet"
              selectedKeys={formData.fromWallet ? [formData.fromWallet] : []}
              onSelectionChange={(keys) => handleInputChange('fromWallet', Array.from(keys)[0] || '')}
              isInvalid={!!errors.fromWallet}
              errorMessage={errors.fromWallet}
              isRequired
              radius={themeRadius}
              classNames={{ trigger: "bg-default-100" }}
              startContent={<WalletIcon className="w-4 h-4 text-default-400" />}
            >
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} textValue={wallet.name}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="font-medium">{wallet.name}</span>
                      <p className="text-tiny text-default-400 font-mono">
                        {wallet.address?.substring(0, 8)}...{wallet.address?.slice(-6)}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>

            {/* To Address */}
            <Input
              label="Recipient Address"
              placeholder="Enter recipient wallet address"
              value={formData.toAddress}
              onValueChange={(value) => handleInputChange('toAddress', value)}
              isInvalid={!!errors.toAddress}
              errorMessage={errors.toAddress}
              isRequired
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
            />

            {/* Amount */}
            <Input
              label="Amount"
              placeholder="0.00"
              type="number"
              value={formData.amount}
              onValueChange={(value) => handleInputChange('amount', value)}
              isInvalid={!!errors.amount}
              errorMessage={errors.amount}
              isRequired
              radius={themeRadius}
              classNames={{ inputWrapper: "bg-default-100" }}
              endContent={
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-400">{token?.symbol}</span>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="text-tiny"
                    onPress={() => handleInputChange('amount', tokenBalance)}
                  >
                    MAX
                  </Button>
                </div>
              }
            />

            <Divider />

            {/* Gas Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Gas Limit"
                placeholder="65000"
                value={formData.gasLimit}
                onValueChange={(value) => handleInputChange('gasLimit', value)}
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              <Input
                label="Gas Price (Gwei)"
                placeholder="20"
                value={formData.gasPrice}
                onValueChange={(value) => handleInputChange('gasPrice', value)}
                radius={themeRadius}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
            </div>

            {/* Transaction Summary */}
            {formData.amount && estimatedFee && (
              <Card>
                <CardBody className="space-y-2">
                  <h4 className="text-sm font-medium">Transaction Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-500">Transfer Amount:</span>
                      <span className="font-medium">{formData.amount} {token?.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">Network Fee:</span>
                      <span className="font-medium">{estimatedFee} ETH</span>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Remaining Balance:</span>
                      <span>
                        {(parseFloat(tokenBalance) - parseFloat(formData.amount || 0)).toFixed(4)} {token?.symbol}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Warning */}
            <div className="p-4 bg-warning-50 border-l-4 border-warning rounded-r-lg">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 shrink-0" />
                <div>
                  <p className="text-sm text-warning-800 font-medium">Important</p>
                  <p className="text-sm text-warning-700 mt-1">
                    Verify the recipient address and amount before confirming. Token transfers cannot be reversed.
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
            onPress={handleTransfer}
            isLoading={loading}
            radius={themeRadius}
            startContent={!loading ? <ArrowsRightLeftIcon className="w-4 h-4" /> : null}
          >
            {loading ? 'Transferring...' : 'Transfer'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TokenTransferModal;