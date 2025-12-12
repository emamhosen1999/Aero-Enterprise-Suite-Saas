import React from 'react';
import { Card, CardBody, CardHeader, Input, Tabs, Tab, Button, Chip, Code, Accordion, AccordionItem } from '@heroui/react';
import { MagnifyingGlassIcon, ClipboardIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { showToast } from '@/utils/toastUtils';

export default function ApiDocumentation({ apiDocs = {} }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [copiedEndpoint, setCopiedEndpoint] = React.useState(null);

    const categories = React.useMemo(() => {
        const cats = ['all'];
        Object.keys(apiDocs.endpoints || {}).forEach(category => {
            if (!cats.includes(category)) cats.push(category);
        });
        return cats;
    }, [apiDocs]);

    const filteredEndpoints = React.useMemo(() => {
        const allEndpoints = [];
        
        Object.entries(apiDocs.endpoints || {}).forEach(([category, endpoints]) => {
            if (selectedCategory === 'all' || selectedCategory === category) {
                endpoints.forEach(endpoint => {
                    const matchesSearch = 
                        endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        endpoint.method.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    if (matchesSearch) {
                        allEndpoints.push({ ...endpoint, category });
                    }
                });
            }
        });
        
        return allEndpoints;
    }, [apiDocs, selectedCategory, searchTerm]);

    const getMethodColor = (method) => {
        const colors = {
            GET: 'primary',
            POST: 'success',
            PUT: 'warning',
            PATCH: 'warning',
            DELETE: 'danger',
        };
        return colors[method.toUpperCase()] || 'default';
    };

    const copyToClipboard = (text, endpoint) => {
        navigator.clipboard.writeText(text);
        setCopiedEndpoint(endpoint);
        showToast.success('Copied to clipboard');
        setTimeout(() => setCopiedEndpoint(null), 2000);
    };

    const generateCurlExample = (endpoint) => {
        let curl = `curl -X ${endpoint.method.toUpperCase()} "${apiDocs.baseUrl}${endpoint.path}"`;
        
        if (endpoint.auth) {
            curl += ` \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`;
        }
        
        curl += ` \\\n  -H "Content-Type: application/json"`;
        curl += ` \\\n  -H "Accept: application/json"`;
        
        if (endpoint.method !== 'GET' && endpoint.exampleRequest) {
            curl += ` \\\n  -d '${JSON.stringify(endpoint.exampleRequest, null, 2)}'`;
        }
        
        return curl;
    };

    const generateJavaScriptExample = (endpoint) => {
        let code = `const response = await fetch('${apiDocs.baseUrl}${endpoint.path}', {\n`;
        code += `  method: '${endpoint.method.toUpperCase()}',\n`;
        code += `  headers: {\n`;
        
        if (endpoint.auth) {
            code += `    'Authorization': 'Bearer YOUR_API_TOKEN',\n`;
        }
        
        code += `    'Content-Type': 'application/json',\n`;
        code += `    'Accept': 'application/json'\n`;
        code += `  }`;
        
        if (endpoint.method !== 'GET' && endpoint.exampleRequest) {
            code += `,\n  body: JSON.stringify(${JSON.stringify(endpoint.exampleRequest, null, 2)})`;
        }
        
        code += `\n});\n\n`;
        code += `const data = await response.json();\n`;
        code += `console.log(data);`;
        
        return code;
    };

    const generatePhpExample = (endpoint) => {
        let code = `$ch = curl_init();\n\n`;
        code += `curl_setopt($ch, CURLOPT_URL, "${apiDocs.baseUrl}${endpoint.path}");\n`;
        code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);\n`;
        code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${endpoint.method.toUpperCase()}");\n\n`;
        
        code += `$headers = [\n`;
        if (endpoint.auth) {
            code += `    'Authorization: Bearer YOUR_API_TOKEN',\n`;
        }
        code += `    'Content-Type: application/json',\n`;
        code += `    'Accept: application/json'\n`;
        code += `];\n\n`;
        
        code += `curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n`;
        
        if (endpoint.method !== 'GET' && endpoint.exampleRequest) {
            code += `\n$data = ${JSON.stringify(endpoint.exampleRequest, null, 2)};\n`;
            code += `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));\n`;
        }
        
        code += `\n$response = curl_exec($ch);\n`;
        code += `curl_close($ch);\n\n`;
        code += `$data = json_decode($response, true);`;
        
        return code;
    };

    const exportAsPostman = () => {
        const collection = {
            info: {
                name: apiDocs.title || 'API Documentation',
                description: apiDocs.description || '',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
            },
            item: []
        };

        Object.entries(apiDocs.endpoints || {}).forEach(([category, endpoints]) => {
            const folder = {
                name: category,
                item: endpoints.map(endpoint => ({
                    name: endpoint.description,
                    request: {
                        method: endpoint.method.toUpperCase(),
                        header: [
                            ...(endpoint.auth ? [{ key: 'Authorization', value: 'Bearer {{api_token}}' }] : []),
                            { key: 'Content-Type', value: 'application/json' },
                            { key: 'Accept', value: 'application/json' }
                        ],
                        url: {
                            raw: `${apiDocs.baseUrl}${endpoint.path}`,
                            host: [apiDocs.baseUrl],
                            path: endpoint.path.split('/').filter(Boolean)
                        },
                        body: endpoint.exampleRequest ? {
                            mode: 'raw',
                            raw: JSON.stringify(endpoint.exampleRequest, null, 2)
                        } : undefined
                    }
                }))
            };
            collection.item.push(folder);
        });

        const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'api-collection.json';
        link.click();
        URL.revokeObjectURL(url);
        showToast.success('Postman collection exported');
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader className="flex flex-col gap-3">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h3 className="text-lg font-semibold">{apiDocs.title || 'API Documentation'}</h3>
                            <p className="text-sm text-default-500">{apiDocs.description}</p>
                        </div>
                        <Button
                            color="primary"
                            variant="flat"
                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                            onPress={exportAsPostman}
                        >
                            Export Postman
                        </Button>
                    </div>

                    <div className="flex gap-3">
                        <Input
                            placeholder="Search endpoints..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                            className="max-w-xs"
                        />
                        
                        <Tabs
                            selectedKey={selectedCategory}
                            onSelectionChange={setSelectedCategory}
                            variant="underlined"
                        >
                            {categories.map(cat => (
                                <Tab key={cat} title={cat === 'all' ? 'All' : cat} />
                            ))}
                        </Tabs>
                    </div>
                </CardHeader>
            </Card>

            {/* Endpoints */}
            <Card>
                <CardBody>
                    {filteredEndpoints.length === 0 ? (
                        <p className="text-center text-default-500 py-8">No endpoints found</p>
                    ) : (
                        <Accordion variant="bordered">
                            {filteredEndpoints.map((endpoint, index) => (
                                <AccordionItem
                                    key={index}
                                    title={
                                        <div className="flex items-center gap-3">
                                            <Chip
                                                size="sm"
                                                color={getMethodColor(endpoint.method)}
                                                variant="flat"
                                                className="min-w-[70px]"
                                            >
                                                {endpoint.method.toUpperCase()}
                                            </Chip>
                                            <Code className="flex-1">{endpoint.path}</Code>
                                            {endpoint.auth && (
                                                <Chip size="sm" variant="flat">🔒 Auth Required</Chip>
                                            )}
                                        </div>
                                    }
                                    subtitle={endpoint.description}
                                >
                                    <div className="space-y-4 p-4">
                                        {/* Parameters */}
                                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold mb-2">Parameters</h5>
                                                <div className="space-y-2">
                                                    {endpoint.parameters.map((param, i) => (
                                                        <div key={i} className="flex items-start gap-2 p-2 bg-default-100 rounded">
                                                            <Code size="sm">{param.name}</Code>
                                                            <Chip size="sm" color={param.required ? 'danger' : 'default'} variant="flat">
                                                                {param.required ? 'Required' : 'Optional'}
                                                            </Chip>
                                                            <span className="text-sm text-default-600">{param.description}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Example Request */}
                                        {endpoint.exampleRequest && (
                                            <div>
                                                <h5 className="font-semibold mb-2">Example Request</h5>
                                                <pre className="p-3 bg-default-100 rounded overflow-x-auto text-sm">
                                                    {JSON.stringify(endpoint.exampleRequest, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Example Response */}
                                        {endpoint.exampleResponse && (
                                            <div>
                                                <h5 className="font-semibold mb-2">Example Response</h5>
                                                <pre className="p-3 bg-default-100 rounded overflow-x-auto text-sm">
                                                    {JSON.stringify(endpoint.exampleResponse, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Code Examples */}
                                        <div>
                                            <h5 className="font-semibold mb-2">Code Examples</h5>
                                            <Tabs variant="underlined">
                                                <Tab title="cURL">
                                                    <div className="relative">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            startContent={<ClipboardIcon className="w-4 h-4" />}
                                                            className="absolute top-2 right-2 z-10"
                                                            onPress={() => copyToClipboard(generateCurlExample(endpoint), 'curl-' + index)}
                                                        >
                                                            {copiedEndpoint === 'curl-' + index ? 'Copied!' : 'Copy'}
                                                        </Button>
                                                        <pre className="p-3 bg-default-100 rounded overflow-x-auto text-sm">
                                                            {generateCurlExample(endpoint)}
                                                        </pre>
                                                    </div>
                                                </Tab>
                                                <Tab title="JavaScript">
                                                    <div className="relative">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            startContent={<ClipboardIcon className="w-4 h-4" />}
                                                            className="absolute top-2 right-2 z-10"
                                                            onPress={() => copyToClipboard(generateJavaScriptExample(endpoint), 'js-' + index)}
                                                        >
                                                            {copiedEndpoint === 'js-' + index ? 'Copied!' : 'Copy'}
                                                        </Button>
                                                        <pre className="p-3 bg-default-100 rounded overflow-x-auto text-sm">
                                                            {generateJavaScriptExample(endpoint)}
                                                        </pre>
                                                    </div>
                                                </Tab>
                                                <Tab title="PHP">
                                                    <div className="relative">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            startContent={<ClipboardIcon className="w-4 h-4" />}
                                                            className="absolute top-2 right-2 z-10"
                                                            onPress={() => copyToClipboard(generatePhpExample(endpoint), 'php-' + index)}
                                                        >
                                                            {copiedEndpoint === 'php-' + index ? 'Copied!' : 'Copy'}
                                                        </Button>
                                                        <pre className="p-3 bg-default-100 rounded overflow-x-auto text-sm">
                                                            {generatePhpExample(endpoint)}
                                                        </pre>
                                                    </div>
                                                </Tab>
                                            </Tabs>
                                        </div>
                                    </div>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
