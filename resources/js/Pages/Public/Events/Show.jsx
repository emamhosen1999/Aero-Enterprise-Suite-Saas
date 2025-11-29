import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Input,
    Textarea,
    Select,
    SelectItem,
    Checkbox,
    CheckboxGroup,
    Divider
} from "@heroui/react";
import {
    CalendarIcon,
    MapPinIcon,
    UserGroupIcon,
    ClockIcon,
    ArrowLeftIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import { showToast } from '@/utils/toastUtils';

// Helper function to get theme radius from CSS variable
const getThemeRadius = () => {
    const borderRadius = getComputedStyle(document.documentElement)
        .getPropertyValue('--borderRadius')
        .trim();
    return borderRadius || 'md';
};

const PublicEventShow = ({ event, canRegister, registrationStatus, remainingSlots }) => {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        organization_or_department: '',
        gender: 'prefer_not_to_say',
        sub_event_ids: [],
        payment_proof: null,
        custom_fields: {}
    });
    
    const [paymentProofPreview, setPaymentProofPreview] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    
    const handlePaymentProofChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('payment_proof', file);
            setPaymentProofPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'sub_event_ids') {
                data[key].forEach(id => formData.append('sub_event_ids[]', id));
            } else if (key === 'custom_fields') {
                Object.keys(data[key]).forEach(fieldKey => {
                    formData.append(`custom_fields[${fieldKey}]`, data[key][fieldKey]);
                });
            } else if (key === 'payment_proof' && data[key]) {
                formData.append(key, data[key]);
            } else if (data[key]) {
                formData.append(key, data[key]);
            }
        });
        
        post(route('public.events.register', event.slug), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                showToast.success('Registration submitted successfully!');
            },
            onError: (errors) => {
                showToast.error('Failed to submit registration. Please check the form.');
                console.error(errors);
            }
        });
    };
    
    const totalFee = event.sub_events
        ?.filter(se => data.sub_event_ids.includes(se.id.toString()))
        .reduce((sum, se) => sum + parseFloat(se.joining_fee || 0), 0) || 0;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-background">
            <Head title={event.title} />
            
            {/* Hero Section with Banner */}
            {event.banner_image && (
                <div className="relative h-96 bg-black">
                    <img
                        src={`/storage/${event.banner_image}`}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
                            <Button
                                variant="flat"
                                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                                onPress={() => router.get(route('public.events.index'))}
                                className="mb-4"
                                radius={getThemeRadius()}
                            >
                                Back to Events
                            </Button>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{event.title}</h1>
                            <div className="flex flex-wrap gap-4 text-white/90">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" />
                                    <span>{dayjs(event.event_date).format('MMMM DD, YYYY')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5" />
                                    <span>{event.event_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="w-5 h-5" />
                                    <span>{event.venue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <Card radius={getThemeRadius()}>
                            <CardBody>
                                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                                <p className="text-default-700 whitespace-pre-line">{event.description}</p>
                            </CardBody>
                        </Card>
                        
                        {/* Sub-Events */}
                        {event.sub_events && event.sub_events.length > 0 && (
                            <Card radius={getThemeRadius()}>
                                <CardBody>
                                    <h2 className="text-2xl font-bold mb-4">Sub-Events</h2>
                                    <div className="space-y-4">
                                        {event.sub_events.map((subEvent) => (
                                            <div key={subEvent.id} className="p-4 bg-default-100 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{subEvent.title}</h3>
                                                        <p className="text-sm text-default-600 mt-1">{subEvent.description}</p>
                                                        {subEvent.schedule && (
                                                            <p className="text-sm text-default-500 mt-2">
                                                                <span className="font-medium">Schedule:</span> {subEvent.schedule}
                                                            </p>
                                                        )}
                                                        {subEvent.prize_details && (
                                                            <p className="text-sm text-success mt-1">
                                                                <span className="font-medium">Prize:</span> {subEvent.prize_details}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        {parseFloat(subEvent.joining_fee) > 0 && (
                                                            <Chip color="primary" variant="flat" radius={getThemeRadius()}>৳{subEvent.joining_fee}</Chip>
                                                        )}
                                                        {subEvent.max_participants && (
                                                            <p className="text-xs text-default-500 mt-2">
                                                                Max: {subEvent.max_participants}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                        
                        {/* Additional Info */}
                        {(event.food_details || event.rules) && (
                            <Card radius={getThemeRadius()}>
                                <CardBody>
                                    {event.food_details && (
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold mb-3">Food & Refreshments</h3>
                                            <p className="text-default-700">{event.food_details}</p>
                                        </div>
                                    )}
                                    {event.food_details && event.rules && <Divider />}
                                    {event.rules && (
                                        <div className={event.food_details ? 'mt-6' : ''}>
                                            <h3 className="text-xl font-bold mb-3">Rules & Regulations</h3>
                                            <p className="text-default-700 whitespace-pre-line">{event.rules}</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}
                        
                        {/* Registration Form */}
                        {showRegistrationForm && canRegister && (
                            <Card radius={getThemeRadius()}>
                                <CardHeader>
                                    <h2 className="text-2xl font-bold">Register for Event</h2>
                                </CardHeader>
                                <CardBody>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Full Name"
                                                placeholder="Enter your full name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                errorMessage={errors.name}
                                                isInvalid={!!errors.name}
                                                isRequired
                                                radius={getThemeRadius()}
                                            />
                                            
                                            <Input
                                                type="email"
                                                label="Email"
                                                placeholder="your@email.com"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                errorMessage={errors.email}
                                                isInvalid={!!errors.email}
                                                isRequired
                                                radius={getThemeRadius()}
                                            />
                                            
                                            <Input
                                                label="Phone"
                                                placeholder="Enter phone number"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                errorMessage={errors.phone}
                                                isInvalid={!!errors.phone}
                                                isRequired
                                                radius={getThemeRadius()}
                                            />
                                            
                                            <Select
                                                label="Gender"
                                                selectedKeys={[data.gender]}
                                                onChange={(e) => setData('gender', e.target.value)}
                                                isRequired
                                                radius={getThemeRadius()}
                                            >
                                                <SelectItem key="male" value="male">Male</SelectItem>
                                                <SelectItem key="female" value="female">Female</SelectItem>
                                                <SelectItem key="other" value="other">Other</SelectItem>
                                                <SelectItem key="prefer_not_to_say" value="prefer_not_to_say">Prefer not to say</SelectItem>
                                            </Select>
                                        </div>
                                        
                                        <Textarea
                                            label="Address"
                                            placeholder="Enter your address"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            errorMessage={errors.address}
                                            isInvalid={!!errors.address}
                                            rows={2}
                                            isRequired
                                            radius={getThemeRadius()}
                                        />
                                        
                                        <Input
                                            label="Organization/Department"
                                            placeholder="Your organization or department"
                                            value={data.organization_or_department}
                                            onChange={(e) => setData('organization_or_department', e.target.value)}
                                            radius={getThemeRadius()}
                                        />
                                        
                                        {event.sub_events && event.sub_events.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Select Sub-Events to Participate *
                                                </label>
                                                <CheckboxGroup
                                                    value={data.sub_event_ids}
                                                    onValueChange={(value) => setData('sub_event_ids', value)}
                                                    errorMessage={errors.sub_event_ids}
                                                    isInvalid={!!errors.sub_event_ids}
                                                    radius={getThemeRadius()}
                                                >
                                                    {event.sub_events.map((subEvent) => (
                                                        <Checkbox key={subEvent.id} value={subEvent.id.toString()}>
                                                            {subEvent.title}
                                                            {parseFloat(subEvent.joining_fee) > 0 && (
                                                                <span className="text-primary ml-2">(৳{subEvent.joining_fee})</span>
                                                            )}
                                                        </Checkbox>
                                                    ))}
                                                </CheckboxGroup>
                                            </div>
                                        )}
                                        
                                        {/* Custom Fields */}
                                        {event.custom_fields && event.custom_fields.length > 0 && (
                                            <div className="space-y-4">
                                                <Divider />
                                                <h3 className="font-semibold">Additional Information</h3>
                                                {event.custom_fields.map((field) => (
                                                    <Input
                                                        key={field.id}
                                                        label={field.field_label}
                                                        placeholder={field.placeholder || ''}
                                                        description={field.help_text || ''}
                                                        isRequired={field.is_required}
                                                        onChange={(e) => setData('custom_fields', {
                                                            ...data.custom_fields,
                                                            [field.field_name]: e.target.value
                                                        })}
                                                        radius={getThemeRadius()}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        
                                        {totalFee > 0 && (
                                            <>
                                                <Divider />
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">
                                                        Payment Proof (Total: ৳{totalFee})
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        onChange={handlePaymentProofChange}
                                                        className="block w-full text-sm"
                                                    />
                                                    {paymentProofPreview && (
                                                        <img src={paymentProofPreview} alt="Payment proof" className="mt-3 max-h-32 rounded" />
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                variant="flat"
                                                onPress={() => setShowRegistrationForm(false)}
                                                radius={getThemeRadius()}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                color="primary"
                                                isLoading={processing}
                                                radius={getThemeRadius()}
                                            >
                                                Submit Registration
                                            </Button>
                                        </div>
                                    </form>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                    
                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <Card radius={getThemeRadius()}>
                            <CardBody>
                                <h3 className="text-lg font-bold mb-4">Event Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-default-500">Date & Time</p>
                                        <p className="font-medium">{dayjs(event.event_date).format('MMM DD, YYYY')}</p>
                                        <p className="font-medium">{event.event_time}</p>
                                    </div>
                                    <Divider />
                                    <div>
                                        <p className="text-default-500">Venue</p>
                                        <p className="font-medium">{event.venue}</p>
                                    </div>
                                    {event.registration_deadline && (
                                        <>
                                            <Divider />
                                            <div>
                                                <p className="text-default-500">Registration Deadline</p>
                                                <p className="font-medium">{dayjs(event.registration_deadline).format('MMM DD, YYYY HH:mm')}</p>
                                            </div>
                                        </>
                                    )}
                                    {event.max_participants && (
                                        <>
                                            <Divider />
                                            <div>
                                                <p className="text-default-500">Available Slots</p>
                                                <p className="font-medium">{remainingSlots} / {event.max_participants}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                        
                        {/* Registration CTA */}
                        <Card radius={getThemeRadius()}>
                            <CardBody>
                                {canRegister ? (
                                    <>
                                        <Chip color="success" variant="flat" className="mb-4" radius={getThemeRadius()}>
                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                            Registration Open
                                        </Chip>
                                        {!showRegistrationForm && (
                                            <Button
                                                color="primary"
                                                size="lg"
                                                fullWidth
                                                onPress={() => setShowRegistrationForm(true)}
                                                radius={getThemeRadius()}
                                            >
                                                Register Now
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div>
                                        <Chip color="default" variant="flat" className="mb-2" radius={getThemeRadius()}>
                                            Registration Closed
                                        </Chip>
                                        <p className="text-sm text-default-500">{registrationStatus}</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                        
                        {/* Organizer */}
                        {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
                            <Card radius={getThemeRadius()}>
                                <CardBody>
                                    <h3 className="text-lg font-bold mb-3">Contact Organizer</h3>
                                    <div className="space-y-2 text-sm">
                                        {event.organizer_name && <p><span className="text-default-500">Name:</span> {event.organizer_name}</p>}
                                        {event.organizer_email && <p><span className="text-default-500">Email:</span> {event.organizer_email}</p>}
                                        {event.organizer_phone && <p><span className="text-default-500">Phone:</span> {event.organizer_phone}</p>}
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicEventShow;
