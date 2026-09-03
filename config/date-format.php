<?php

return [
    // ISO / System standard (recommended for reports & exports)
    'Y-m-d' => date('Y-m-d'),

    // International (clear, readable)
    'd M Y' => date('d M Y'),   // 01 Jan 2026
    'M d, Y' => date('M d, Y'), // Jan 01, 2026
    'F d, Y' => date('F d, Y'), // January 01, 2026

    // Numeric – Day first (EU, Africa, most of world)
    'd-m-Y' => date('d-m-Y'),
    'd/m/Y' => date('d/m/Y'),

    // Numeric – Month first (US)
    'm-d-Y' => date('m-d-Y'),
    'm/d/Y' => date('m/d/Y'),

    // Compact (legacy systems / integrations)
    'Ymd' => date('Ymd'),

//    // Advanced / readability (emails, documents)
//    'l, F j, Y' => date('l, F j, Y'),
//    'D, M j, Y' => date('D, M j, Y'),
];
