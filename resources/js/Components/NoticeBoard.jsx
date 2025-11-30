import React, { useState } from 'react';
import { Container, Typography, Button, Grid, Card, CardContent, IconButton, Dialog, TextField, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import dayjs from 'dayjs';
import {Alert, AlertTitle} from "@mui/lab";
import Grow from "@mui/material/Grow";

const NoticeBoard = () => {
    const [notices, setNotices] = useState([
        {
            id: 1,
            title: 'Team Meeting',
            description: 'There will be a team meeting tomorrow at 10 AM in the conference room.',
            date: new Date(),
        },
        {
            id: 2,
            title: 'Project Deadline',
            description: 'The deadline for the ABC project has been extended to next Friday.',
            date: new Date(),
        },
    ]);
    const [open, setOpen] = useState(false);
    const [newNotice, setNewNotice] = useState({ title: '', description: '' });

    // Handle form input for adding new notice
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewNotice({ ...newNotice, [name]: value });
    };

    // Add a new notice
    const handleAddNotice = () => {
        setNotices([...notices, { ...newNotice, id: Date.now(), date: new Date() }]);
        setNewNotice({ title: '', description: '' });
        setOpen(false);
    };

    // Delete notice by id
    const handleDeleteNotice = (id) => {
        setNotices(notices.filter((notice) => notice.id !== id));
    };

    // Open and close modal
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2}}>
            <Grow in>
                <Card className="shadow-lg">
                    <CardContent>
                        <Box className="mb-4" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Typography variant="h5" align="center">
                                Notice Board
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {notices.map((notice) => (
                                <Grid item xs={12} md={6} key={notice.id}>
                                    <Alert variant="outlined" severity="info">
                                        <AlertTitle>{notice.title}</AlertTitle>
                                        {notice.description}
                                    </Alert>
                                </Grid>
                            ))}
                        </Grid>

                        <Box display="flex" justifyContent="center" mt={4}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={handleClickOpen}
                            >
                                Add Notice
                            </Button>
                        </Box>

                        {/* Dialog for Adding a New Notice */}
                        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Add New Notice
                                </Typography>
                                <TextField
                                    name="title"
                                    label="Title"
                                    fullWidth
                                    value={newNotice.title}
                                    onChange={handleInputChange}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    name="description"
                                    label="Description"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={newNotice.description}
                                    onChange={handleInputChange}
                                    sx={{ mb: 2 }}
                                />
                                <Box display="flex" justifyContent="flex-end">
                                    <Button onClick={handleClose} sx={{ mr: 2 }}>
                                        Cancel
                                    </Button>
                                    <Button variant="contained" color="primary" onClick={handleAddNotice}>
                                        Add
                                    </Button>
                                </Box>
                            </Box>
                        </Dialog>
                    </CardContent>
                </Card>
            </Grow>
        </Box>
    );
};

export default NoticeBoard;
