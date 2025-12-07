import { useState } from 'react';
import { 
    Card, 
    CardBody, 
    Button, 
    Input,
    Textarea,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Slider
} from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function KPIBuilder({ kpis = [], onChange }) {
    const [editingKPI, setEditingKPI] = useState(null);

    const addKPI = () => {
        const newKPI = {
            id: Date.now(),
            name: '',
            description: '',
            weight: 10,
            target: 100,
            actual: 0,
            score: 0,
            category: 'performance'
        };
        onChange([...kpis, newKPI]);
        setEditingKPI(newKPI.id);
    };

    const updateKPI = (id, field, value) => {
        const updated = kpis.map(kpi => {
            if (kpi.id === id) {
                const updatedKPI = { ...kpi, [field]: value };
                // Auto-calculate score if target and actual are set
                if (field === 'actual' || field === 'target') {
                    updatedKPI.score = updatedKPI.target > 0 
                        ? Math.round((updatedKPI.actual / updatedKPI.target) * 100)
                        : 0;
                }
                return updatedKPI;
            }
            return kpi;
        });
        onChange(updated);
    };

    const deleteKPI = (id) => {
        onChange(kpis.filter(kpi => kpi.id !== id));
        if (editingKPI === id) {
            setEditingKPI(null);
        }
    };

    const totalWeight = kpis.reduce((sum, kpi) => sum + Number(kpi.weight || 0), 0);
    const averageScore = kpis.length > 0
        ? kpis.reduce((sum, kpi) => sum + (Number(kpi.score || 0) * Number(kpi.weight || 0)), 0) / totalWeight
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">KPIs & Metrics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Define measurable performance indicators
                    </p>
                </div>
                <Button
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={addKPI}
                >
                    Add KPI
                </Button>
            </div>

            {kpis.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-gray-500">No KPIs added yet. Click "Add KPI" to get started.</p>
                    </CardBody>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Card>
                            <CardBody>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total KPIs</p>
                                <p className="text-2xl font-bold">{kpis.length}</p>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Weight</p>
                                <p className="text-2xl font-bold">{totalWeight}%</p>
                                {totalWeight !== 100 && (
                                    <p className="text-xs text-warning mt-1">Should be 100%</p>
                                )}
                            </CardBody>
                        </Card>
                        <Card>
                            <CardBody>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weighted Score</p>
                                <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                            </CardBody>
                        </Card>
                    </div>

                    <Table aria-label="KPIs table">
                        <TableHeader>
                            <TableColumn>KPI</TableColumn>
                            <TableColumn>CATEGORY</TableColumn>
                            <TableColumn>WEIGHT</TableColumn>
                            <TableColumn>TARGET</TableColumn>
                            <TableColumn>ACTUAL</TableColumn>
                            <TableColumn>SCORE</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {kpis.map((kpi) => (
                                <TableRow key={kpi.id}>
                                    <TableCell>
                                        {editingKPI === kpi.id ? (
                                            <Input
                                                size="sm"
                                                value={kpi.name}
                                                onChange={(e) => updateKPI(kpi.id, 'name', e.target.value)}
                                                placeholder="KPI Name"
                                            />
                                        ) : (
                                            <div>
                                                <p className="font-medium">{kpi.name || 'Unnamed KPI'}</p>
                                                {kpi.description && (
                                                    <p className="text-xs text-gray-500">{kpi.description}</p>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingKPI === kpi.id ? (
                                            <Select
                                                size="sm"
                                                selectedKeys={[kpi.category]}
                                                onChange={(e) => updateKPI(kpi.id, 'category', e.target.value)}
                                            >
                                                <SelectItem key="performance" value="performance">Performance</SelectItem>
                                                <SelectItem key="quality" value="quality">Quality</SelectItem>
                                                <SelectItem key="productivity" value="productivity">Productivity</SelectItem>
                                                <SelectItem key="behavior" value="behavior">Behavior</SelectItem>
                                                <SelectItem key="leadership" value="leadership">Leadership</SelectItem>
                                            </Select>
                                        ) : (
                                            <span className="capitalize">{kpi.category}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={kpi.weight}
                                            onChange={(e) => updateKPI(kpi.id, 'weight', Number(e.target.value))}
                                            endContent="%"
                                            min="0"
                                            max="100"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={kpi.target}
                                            onChange={(e) => updateKPI(kpi.id, 'target', Number(e.target.value))}
                                            min="0"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            size="sm"
                                            value={kpi.actual}
                                            onChange={(e) => updateKPI(kpi.id, 'actual', Number(e.target.value))}
                                            min="0"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-semibold ${kpi.score >= 80 ? 'text-success' : kpi.score >= 60 ? 'text-warning' : 'text-danger'}`}>
                                            {kpi.score}%
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {editingKPI === kpi.id ? (
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    onPress={() => setEditingKPI(null)}
                                                >
                                                    Done
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => setEditingKPI(kpi.id)}
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="flat"
                                                isIconOnly
                                                onPress={() => deleteKPI(kpi.id)}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </>
            )}
        </div>
    );
}
