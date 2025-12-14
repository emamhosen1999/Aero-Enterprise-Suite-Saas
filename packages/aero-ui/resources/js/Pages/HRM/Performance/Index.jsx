import {Head, router} from '@inertiajs/react';
import {useState} from 'react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Progress,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from '@heroui/react';
import {CalendarIcon, ChartBarIcon, MagnifyingGlassIcon, PlusIcon, UserIcon} from '@heroicons/react/24/outline';
import App from '@ui/Layouts/App';
import PageHeader from '@ui/Components/PageHeader';

export default function PerformanceIndex({ auth, reviews, filters, employees, templates }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    const handleSearch = () => {
        router.get(route('hr.performance.index'), {
            search: searchTerm,
            status: selectedStatus
        }, { preserveState: true });
    };

    const statusColors = {
        draft: 'default',
        in_progress: 'primary',
        completed: 'success',
        overdue: 'danger'
    };

    const handleCreateReview = () => {
        router.visit(route('hr.performance.create'));
    };

    const handleViewReview = (id) => {
        router.visit(route('hr.performance.show', id));
    };

    return (
        <App user={auth.user}>
            <Head title="Performance Reviews" />
            
            <PageHeader
                title="Performance Management"
                subtitle="Manage employee performance reviews and appraisals"
                action={
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-5 h-5" />}
                        onPress={handleCreateReview}
                    >
                        New Review
                    </Button>
                }
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                                <p className="text-2xl font-bold">{reviews.total}</p>
                            </div>
                            <ChartBarIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                                <p className="text-2xl font-bold">{reviews.in_progress}</p>
                            </div>
                            <UserIcon className="w-8 h-8 text-yellow-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                <p className="text-2xl font-bold">{reviews.completed}</p>
                            </div>
                            <ChartBarIcon className="w-8 h-8 text-green-500" />
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                                <p className="text-2xl font-bold">{reviews.overdue}</p>
                            </div>
                            <CalendarIcon className="w-8 h-8 text-red-500" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardBody>
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Search reviews..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                            className="flex-1"
                        />
                        <Select
                            label="Status"
                            selectedKeys={[selectedStatus]}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full md:w-48"
                        >
                            <SelectItem key="all" value="all">All</SelectItem>
                            <SelectItem key="draft" value="draft">Draft</SelectItem>
                            <SelectItem key="in_progress" value="in_progress">In Progress</SelectItem>
                            <SelectItem key="completed" value="completed">Completed</SelectItem>
                            <SelectItem key="overdue" value="overdue">Overdue</SelectItem>
                        </Select>
                        <Button color="primary" onPress={handleSearch}>
                            Search
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Reviews Table */}
            <Card>
                <CardBody>
                    <Table aria-label="Performance reviews table">
                        <TableHeader>
                            <TableColumn>EMPLOYEE</TableColumn>
                            <TableColumn>REVIEW PERIOD</TableColumn>
                            <TableColumn>REVIEWER</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>SCORE</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {reviews.data?.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{review.employee_name}</p>
                                            <p className="text-sm text-gray-500">{review.designation}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p>{review.review_period}</p>
                                            <p className="text-sm text-gray-500">{review.cycle_name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{review.reviewer_name}</TableCell>
                                    <TableCell>
                                        <Chip color={statusColors[review.status]} size="sm">
                                            {review.status.replace('_', ' ').toUpperCase()}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        {review.final_score ? (
                                            <div>
                                                <Progress value={review.final_score} maxValue={100} size="sm" />
                                                <p className="text-sm mt-1">{review.final_score}/100</p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Not scored</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            size="sm" 
                                            variant="flat"
                                            onPress={() => handleViewReview(review.id)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </App>
    );
}
