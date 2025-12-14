import {Head, router, useForm} from '@inertiajs/react';
import {useState} from 'react';
import {Button, Card, CardBody, Divider, Input, Select, SelectItem, Tab, Tabs, Textarea} from '@heroui/react';
import {ArrowLeftIcon, CheckIcon} from '@heroicons/react/24/outline';
import App from '@ui/Layouts/App';
import PageHeader from '@ui/Components/PageHeader';
import KPIBuilder from '@/Components/HRM/HR/Performance/KPIBuilder';

export default function PerformanceCreate({ auth, employees, templates, reviewTypes, review = null }) {
    const isEdit = !!review;
    const [selectedTab, setSelectedTab] = useState('basic');
    
    const { data, setData, post, put, processing, errors } = useForm({
        employee_id: review?.employee_id || '',
        reviewer_id: review?.reviewer_id || auth.user.id,
        template_id: review?.template_id || '',
        review_type: review?.review_type || 'annual',
        review_period_start: review?.review_period_start || '',
        review_period_end: review?.review_period_end || '',
        due_date: review?.due_date || '',
        goals: review?.goals || '',
        comments: review?.comments || '',
        kpis: review?.kpis || []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEdit) {
            put(route('hr.performance.update', review.id));
        } else {
            post(route('hr.performance.store'));
        }
    };

    const handleBack = () => {
        router.visit(route('hr.performance.index'));
    };

    return (
        <App user={auth.user}>
            <Head title={isEdit ? 'Edit Performance Review' : 'Create Performance Review'} />
            
            <PageHeader
                title={isEdit ? 'Edit Performance Review' : 'Create Performance Review'}
                subtitle="Set up a new performance review for an employee"
                action={
                    <Button
                        variant="flat"
                        startContent={<ArrowLeftIcon className="w-4 h-4" />}
                        onPress={handleBack}
                    >
                        Back
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardBody>
                        <Tabs 
                            selectedKey={selectedTab} 
                            onSelectionChange={setSelectedTab}
                            className="mb-6"
                        >
                            <Tab key="basic" title="Basic Info" />
                            <Tab key="kpis" title="KPIs & Goals" />
                            <Tab key="settings" title="Settings" />
                        </Tabs>

                        {selectedTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Employee"
                                        placeholder="Select employee"
                                        selectedKeys={data.employee_id ? [String(data.employee_id)] : []}
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                        isRequired
                                        errorMessage={errors.employee_id}
                                    >
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.name} - {emp.designation}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Reviewer"
                                        placeholder="Select reviewer"
                                        selectedKeys={data.reviewer_id ? [String(data.reviewer_id)] : []}
                                        onChange={(e) => setData('reviewer_id', e.target.value)}
                                        isRequired
                                        errorMessage={errors.reviewer_id}
                                    >
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.name} - {emp.designation}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        label="Review Template"
                                        placeholder="Select template (optional)"
                                        selectedKeys={data.template_id ? [String(data.template_id)] : []}
                                        onChange={(e) => setData('template_id', e.target.value)}
                                        errorMessage={errors.template_id}
                                    >
                                        {templates?.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="Review Type"
                                        placeholder="Select review type"
                                        selectedKeys={data.review_type ? [data.review_type] : []}
                                        onChange={(e) => setData('review_type', e.target.value)}
                                        isRequired
                                        errorMessage={errors.review_type}
                                    >
                                        <SelectItem key="probation" value="probation">Probation Review</SelectItem>
                                        <SelectItem key="quarterly" value="quarterly">Quarterly Review</SelectItem>
                                        <SelectItem key="mid_year" value="mid_year">Mid-Year Review</SelectItem>
                                        <SelectItem key="annual" value="annual">Annual Review</SelectItem>
                                        <SelectItem key="360" value="360">360° Review</SelectItem>
                                    </Select>
                                </div>

                                <Divider />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        type="date"
                                        label="Review Period Start"
                                        value={data.review_period_start}
                                        onChange={(e) => setData('review_period_start', e.target.value)}
                                        isRequired
                                        errorMessage={errors.review_period_start}
                                    />

                                    <Input
                                        type="date"
                                        label="Review Period End"
                                        value={data.review_period_end}
                                        onChange={(e) => setData('review_period_end', e.target.value)}
                                        isRequired
                                        errorMessage={errors.review_period_end}
                                    />

                                    <Input
                                        type="date"
                                        label="Due Date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        isRequired
                                        errorMessage={errors.due_date}
                                    />
                                </div>

                                <Textarea
                                    label="Goals & Objectives"
                                    placeholder="Enter goals and objectives for this review period..."
                                    value={data.goals}
                                    onChange={(e) => setData('goals', e.target.value)}
                                    minRows={4}
                                    errorMessage={errors.goals}
                                />
                            </div>
                        )}

                        {selectedTab === 'kpis' && (
                            <div className="space-y-6">
                                <KPIBuilder
                                    kpis={data.kpis}
                                    onChange={(kpis) => setData('kpis', kpis)}
                                />
                            </div>
                        )}

                        {selectedTab === 'settings' && (
                            <div className="space-y-6">
                                <Textarea
                                    label="Additional Comments"
                                    placeholder="Add any additional comments or notes..."
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    minRows={6}
                                    errorMessage={errors.comments}
                                />
                            </div>
                        )}

                        <Divider className="my-6" />

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="flat"
                                onPress={handleBack}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                type="submit"
                                isLoading={processing}
                                startContent={<CheckIcon className="w-4 h-4" />}
                            >
                                {isEdit ? 'Update Review' : 'Create Review'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </form>
        </App>
    );
}
