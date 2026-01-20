import React, { useState } from 'react';
import { Input, Button, Card, CardBody } from '@heroui/react';
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Newsletter = ({ content = {}, settings = {} }) => {
  const {
    title = 'Stay Updated',
    subtitle = 'Subscribe to our newsletter for the latest updates and news.',
    placeholder = 'Enter your email',
    buttonText = 'Subscribe',
    successMessage = 'Thanks for subscribing!',
    actionUrl = '',
    layout = 'inline',
    showNameField = false,
    namePlaceholder = 'Your name',
  } = content;

  const {
    bgColor = '#000000',
    textColor = '#ffffff',
    padding = 'lg',
    textAlign = 'center',
  } = settings;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const paddingMap = {
    none: 'p-0',
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8 lg:p-12',
    lg: 'p-8 md:p-12 lg:p-16',
    xl: 'p-12 md:p-16 lg:p-20',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      if (actionUrl) {
        await fetch(actionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });
      }
      setIsSubmitted(true);
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full ${paddingMap[padding]}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={`max-w-2xl ${textAlign === 'center' ? 'mx-auto text-center' : ''}`}
        >
          {/* Header */}
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
          )}
          {subtitle && (
            <p className="text-lg opacity-80 mb-8">{subtitle}</p>
          )}

          {/* Form */}
          {isSubmitted ? (
            <Card className="bg-success/20 border border-success/30">
              <CardBody className="flex-row items-center gap-3 py-4">
                <CheckCircleIcon className="w-6 h-6 text-success" />
                <span className="text-success font-medium">{successMessage}</span>
              </CardBody>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              {layout === 'inline' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  {showNameField && (
                    <Input
                      type="text"
                      placeholder={namePlaceholder}
                      value={name}
                      onValueChange={setName}
                      classNames={{
                        inputWrapper: 'bg-white/10 border-white/20 hover:bg-white/20',
                        input: 'text-white placeholder:text-white/50',
                      }}
                    />
                  )}
                  <Input
                    type="email"
                    placeholder={placeholder}
                    value={email}
                    onValueChange={setEmail}
                    startContent={<EnvelopeIcon className="w-5 h-5 text-white/50" />}
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-white/10 border-white/20 hover:bg-white/20',
                      input: 'text-white placeholder:text-white/50',
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isSubmitting}
                    className="whitespace-nowrap"
                  >
                    {buttonText}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {showNameField && (
                    <Input
                      type="text"
                      label="Name"
                      placeholder={namePlaceholder}
                      value={name}
                      onValueChange={setName}
                      classNames={{
                        inputWrapper: 'bg-white/10 border-white/20 hover:bg-white/20',
                        input: 'text-white placeholder:text-white/50',
                        label: 'text-white/70',
                      }}
                    />
                  )}
                  <Input
                    type="email"
                    label="Email"
                    placeholder={placeholder}
                    value={email}
                    onValueChange={setEmail}
                    startContent={<EnvelopeIcon className="w-5 h-5 text-white/50" />}
                    isRequired
                    classNames={{
                      inputWrapper: 'bg-white/10 border-white/20 hover:bg-white/20',
                      input: 'text-white placeholder:text-white/50',
                      label: 'text-white/70',
                    }}
                  />
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {buttonText}
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Privacy Note */}
          {!isSubmitted && (
            <p className="text-xs opacity-50 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Newsletter;
