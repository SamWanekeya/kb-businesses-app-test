<?php

return [
    // 24-hour format (recommended default)
    'H:i' => date('H:i'),      // 13:30

    // 12-hour format (common in US & some regions)
    'h:i A' => date('h:i A'),  // 01:30 PM

    // 24-hour with seconds (reports, logs, exports)
    'H:i:s' => date('H:i:s'),  // 13:30:00

    // 12-hour with seconds
    'h:i:s A' => date('h:i:s A'), // 01:30:00 PM

    // Compact numeric (legacy systems / integrations)
    'Hi' => date('Hi'),        // 1330
];
