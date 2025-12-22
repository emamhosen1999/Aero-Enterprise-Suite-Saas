import React, {useState} from 'react';
import {useForm} from '@inertiajs/react';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login'); // Use the appropriate route for login
    };

    return (
        <div className="auth-page-wrapper pt-5">
        </div>
    );
};

export default Login;
