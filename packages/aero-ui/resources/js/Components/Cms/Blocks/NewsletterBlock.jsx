import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Input, Button } from '@heroui/react';
import { showToast } from '@/utils/toastUtils';

const NewsletterBlock = ({ data = {} }) => {
    const {
        title = 'Subscribe to Our Newsletter',
        description = 'Get the latest updates delivered to your inbox',
        placeholder = 'Enter your email',
        backgroundColor = '#f3f4f6',
        submitUrl = ''
    } = data;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            showToast.error('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(submitUrl || '/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showToast.success('Successfully subscribed!');
                setEmail('');
            } else {
                showToast.error('Subscription failed. Please try again.');
            }
        } catch (error) {
            showToast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            style={{ backgroundColor }}
            className="border-0"
        >
            <CardHeader className="flex flex-col items-start px-6 pt-8">
                <h3 className="text-2xl font-bold">{title}</h3>
                {description && <p className="text-default-600 mt-2">{description}</p>}
            </CardHeader>

            <CardBody className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <Input
                        type="email"
                        placeholder={placeholder}
                        value={email}
                        onValueChange={setEmail}
                        className="flex-1"
                        radius="lg"
                        classNames={{
                            inputWrapper: "bg-content1 dark:bg-content2 border border-divider"
                        }}
                    />
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={loading}
                        className="whitespace-nowrap"
                        size="lg"
                    >
                        Subscribe
                    </Button>
                </form>
            </CardBody>
        </Card>
    );
};

export default NewsletterBlock;
