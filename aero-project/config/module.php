<?php

return [
    'code' => 'project',
    'name' => 'Project Management',
    'description' => 'Project management with tasks, milestones, time tracking, and Gantt charts',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'BriefcaseIcon',
    'priority' => 13,
    'enabled' => env('PROJECT_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],
];
