/* EVORA syllabi.
   To add an exam: copy a block with `exam` + `examLabel` (it appears in the dropdown automatically).
   To add a language/skill: copy a block with `match` (matched against the goal title).
   Remember the comma between entries. */
const SYLLABI = [
    {
        exam: 'JEE',
        examLabel: 'JEE (Main / Advanced)',
        match: (t, exam) => /\bjee\b/.test(t),
        sections: {
            "Physics – Mechanics": ["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Centre of Mass & Collisions", "Rotational Motion", "Gravitation", "Properties of Solids & Fluids", "Simple Harmonic Motion"],
            "Physics – Heat & Waves": ["Thermodynamics", "Kinetic Theory of Gases", "Calorimetry & Heat Transfer", "Waves & Sound"],
            "Physics – Electricity & Magnetism": ["Electrostatics", "Capacitors", "Current Electricity", "Magnetic Effects of Current", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves"],
            "Physics – Optics & Modern Physics": ["Ray Optics", "Wave Optics", "Dual Nature of Matter", "Atoms & Nuclei", "Semiconductors & Devices"],
            "Chemistry – Physical": ["Mole Concept", "Atomic Structure", "States of Matter", "Chemical Thermodynamics", "Chemical & Ionic Equilibrium", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry"],
            "Chemistry – Inorganic": ["Periodic Table & Periodicity", "Chemical Bonding", "s-Block Elements", "p-Block Elements", "d & f Block Elements", "Coordination Compounds", "Metallurgy", "Qualitative Analysis"],
            "Chemistry – Organic": ["General Organic Chemistry", "Isomerism", "Hydrocarbons", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids & Derivatives", "Amines", "Biomolecules & Polymers"],
            "Maths – Algebra": ["Sets, Relations & Functions", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Permutations & Combinations", "Binomial Theorem", "Matrices & Determinants", "Probability", "Statistics"],
            "Maths – Calculus": ["Limits & Continuity", "Differentiation", "Applications of Derivatives", "Indefinite Integration", "Definite Integration", "Area Under Curves", "Differential Equations"],
            "Maths – Coordinate Geometry & Vectors": ["Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola", "Vector Algebra", "3D Geometry", "Trigonometry & Inverse Trig"],
            "Practice & Revision": ["NCERT Exemplar", "Previous Year Questions", "Chapter-wise Tests", "Full Mock Tests", "Formula Sheet", "Mistake Notebook"]
        }
    },
    {
        exam: 'GATE ECE',
        examLabel: 'GATE – ECE',
        sections: {
            "General Aptitude": ["Verbal Ability", "Numerical Ability", "Logical Reasoning"],
            "Engineering Mathematics": ["Linear Algebra", "Calculus", "Differential Equations", "Complex Analysis", "Probability & Statistics", "Numerical Methods"],
            "Networks, Signals & Systems": ["Network Theorems", "Transient Analysis", "Two-port Networks", "Fourier Series & Transform", "Laplace Transform", "Z-Transform", "LTI Systems", "Sampling"],
            "Electronic Devices & Circuits": ["Semiconductor Physics", "PN Junction & Diodes", "BJT & MOSFET", "Amplifiers", "Op-Amp Circuits", "Oscillators & Feedback"],
            "Digital Electronics": ["Boolean Algebra & K-Maps", "Combinational Circuits", "Sequential Circuits", "ADC / DAC", "Microprocessors (8085/8086)"],
            "Control Systems": ["Block Diagrams & Signal Flow", "Time Response", "Routh-Hurwitz Stability", "Root Locus", "Bode & Nyquist Plots", "State Space"],
            "Communications": ["Analog Modulation (AM, FM)", "Random Processes & Noise", "Digital Modulation", "Information Theory", "Error Control Coding"],
            "Electromagnetics": ["Maxwell's Equations", "Wave Propagation", "Transmission Lines", "Waveguides", "Antennas"],
            "Practice & Revision": ["Previous Year Papers", "Mock Tests", "Formula Sheet"]
        }
    },
    {
        exam: 'GATE ME',
        examLabel: 'GATE – Mechanical',
        sections: {
            "General Aptitude": ["Verbal Ability", "Numerical Ability", "Logical Reasoning"],
            "Engineering Mathematics": ["Linear Algebra", "Calculus", "Differential Equations", "Probability & Statistics", "Numerical Methods"],
            "Engineering Mechanics & Strength of Materials": ["Free Body Diagrams & Equilibrium", "Friction & Virtual Work", "Stress & Strain", "Mohr's Circle", "Bending & Shear in Beams", "Torsion", "Columns & Buckling"],
            "Theory of Machines & Design": ["Mechanisms & Gears", "Cams & Flywheels", "Vibrations", "Design of Shafts, Bolts & Bearings", "Fatigue & Failure Theories"],
            "Fluid Mechanics & Machines": ["Fluid Properties & Statics", "Bernoulli & Momentum", "Pipe Flow & Boundary Layer", "Turbines", "Pumps"],
            "Thermal Sciences": ["Laws of Thermodynamics", "Entropy & Availability", "Power Cycles (Rankine, Brayton)", "Refrigeration & Psychrometry", "IC Engines", "Heat Conduction", "Convection & Radiation", "Heat Exchangers"],
            "Materials, Production & Industrial Engineering": ["Engineering Materials", "Casting & Welding", "Forming & Machining", "Metrology", "CAD / CAM", "Operations Research", "Inventory & Forecasting", "PERT / CPM"],
            "Practice & Revision": ["Previous Year Papers", "Mock Tests", "Formula Sheet"]
        }
    },
    {
        exam: 'NEET',
        examLabel: 'NEET (UG)',
        sections: {
            "Physics – Mechanics": ["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Properties of Matter"],
            "Physics – Others": ["Thermodynamics & Kinetic Theory", "Oscillations & Waves", "Electrostatics", "Current Electricity", "Magnetism & EMI", "Ray & Wave Optics", "Dual Nature", "Atoms & Nuclei", "Semiconductors"],
            "Chemistry – Physical": ["Mole Concept", "Atomic Structure", "Thermodynamics", "Equilibrium", "Solutions", "Electrochemistry", "Chemical Kinetics"],
            "Chemistry – Inorganic": ["Periodic Table", "Chemical Bonding", "s & p Block", "d & f Block", "Coordination Compounds"],
            "Chemistry – Organic": ["General Organic Chemistry", "Hydrocarbons", "Haloalkanes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Acids", "Amines", "Biomolecules"],
            "Biology – Botany": ["Cell Structure & Division", "Plant Kingdom", "Morphology & Anatomy of Plants", "Photosynthesis & Respiration", "Plant Growth", "Reproduction in Plants"],
            "Biology – Zoology": ["Animal Kingdom", "Human Physiology", "Human Reproduction", "Genetics & Evolution", "Biotechnology", "Ecology & Environment", "Human Health & Diseases"],
            "Practice & Revision": ["NCERT Line-by-Line", "Previous Year Papers", "Mock Tests", "Mistake Notebook"]
        }
    },
    {
        match: t => /c\+\+|\bcpp\b/.test(t),
        sections: {
            "C++ Basics": ["Syntax & Program Structure", "Data Types & Variables", "Operators", "Input / Output (cin, cout)", "Type Casting"],
            "Control Flow": ["if / else / switch", "for, while, do-while", "break & continue"],
            "Functions": ["Parameters & Return Values", "Pass by Value / Reference", "Function Overloading", "Default Arguments", "Inline Functions", "Recursion"],
            "Arrays, Strings & Pointers": ["Arrays (1D / 2D)", "C-strings & std::string", "Pointers", "Pointer Arithmetic", "References", "Dynamic Memory (new / delete)"],
            "Object-Oriented Programming": ["Classes & Objects", "Constructors & Destructors", "Encapsulation", "Inheritance", "Polymorphism & Virtual Functions", "Abstract Classes", "Operator Overloading", "Friend Functions"],
            "STL": ["vector, list, deque", "map, set, unordered_map", "stack, queue, priority_queue", "Iterators", "Algorithms (sort, find, etc.)"],
            "Advanced C++": ["Templates", "Exception Handling", "File Handling", "Smart Pointers", "Lambda Expressions", "Move Semantics"],
            "Practice": ["Pattern Problems", "Mini Projects", "Competitive Programming Basics"]
        }
    },
    {
        match: t => /\bc\b(?!\+|#)/.test(t) || /c programming|c language/.test(t),
        sections: {
            "C Basics": ["Structure of a C Program", "Data Types & Variables", "Operators", "Input / Output (printf, scanf)", "Type Conversion"],
            "Control Flow": ["if / else / switch", "for, while, do-while", "break, continue, goto"],
            "Functions": ["Declaration & Definition", "Call by Value / Reference", "Recursion", "Storage Classes", "Header Files"],
            "Arrays & Strings": ["1D & 2D Arrays", "String Functions", "Character Arrays"],
            "Pointers": ["Pointer Basics", "Pointer Arithmetic", "Pointers & Arrays", "Pointers to Functions", "Dynamic Memory (malloc, calloc, free)"],
            "Structures & Files": ["Structures & Unions", "Enums & typedef", "File Handling", "Command-line Arguments", "Preprocessor Directives"],
            "Practice": ["Pattern Problems", "Sorting & Searching in C", "Mini Projects"]
        }
    },
    {
        match: t => /javascript|\bjs\b|node\.?js|react/.test(t),
        sections: {
            "JavaScript Fundamentals": ["Variables (let, const, var)", "Data Types", "Operators", "Conditionals & Loops", "Functions & Arrow Functions", "Scope & Hoisting"],
            "Data Structures": ["Arrays & Array Methods", "Objects", "Strings", "Map & Set", "Destructuring & Spread"],
            "Core Concepts": ["Closures", "this Keyword", "Prototypes & Classes", "Modules (import / export)", "Error Handling"],
            "Asynchronous JS": ["Callbacks", "Promises", "async / await", "Event Loop", "Fetch API"],
            "DOM & Browser": ["Selecting & Changing Elements", "Events", "Forms & Validation", "localStorage", "Browser APIs"],
            "Tools & Frameworks": ["npm & Node.js Basics", "ES6+ Features", "React Basics", "Testing Basics"],
            "Projects": ["To-Do App", "Weather App (API)", "Portfolio Website"]
        }
    },
    {
        match: t => /\bjava\b/.test(t),
        sections: {
            "Java Basics": ["JDK, JRE & JVM", "Syntax & Data Types", "Operators", "Control Statements", "Arrays", "Strings"],
            "OOP in Java": ["Classes & Objects", "Constructors", "Inheritance", "Polymorphism", "Abstraction & Interfaces", "Encapsulation", "Packages & Access Modifiers"],
            "Exception Handling & I/O": ["try / catch / finally", "Custom Exceptions", "File I/O", "Serialization"],
            "Collections Framework": ["List (ArrayList, LinkedList)", "Set (HashSet, TreeSet)", "Map (HashMap, TreeMap)", "Queue & Deque", "Iterators", "Comparable & Comparator"],
            "Advanced Java": ["Generics", "Lambda Expressions & Streams", "Multithreading", "Synchronization", "JDBC", "Java 8+ Features"],
            "Frameworks & Web": ["Servlets & JSP Basics", "Spring Boot Basics", "REST APIs", "Maven / Gradle"],
            "Practice": ["DSA in Java", "Mini Projects"]
        }
    },
    {
        match: t => /\bsql\b|dbms|database/.test(t),
        sections: {
            "SQL Basics": ["Data Types", "SELECT, WHERE, ORDER BY", "INSERT, UPDATE, DELETE", "Constraints (PK, FK, UNIQUE)"],
            "Querying": ["Aggregate Functions & GROUP BY", "HAVING", "Joins (INNER, LEFT, RIGHT, FULL)", "Subqueries", "Set Operations", "Window Functions"],
            "Database Design": ["ER Modelling", "Normalization (1NF to BCNF)", "Indexes", "Views"],
            "Advanced": ["Transactions & ACID", "Stored Procedures & Triggers", "Query Optimization", "NoSQL Basics"],
            "Practice": ["Practice Queries", "Mini Database Project"]
        }
    },
    {
        match: t => /html|css|web dev|frontend|front-end/.test(t),
        sections: {
            "HTML": ["Document Structure", "Text, Links & Images", "Lists & Tables", "Forms & Inputs", "Semantic HTML"],
            "CSS": ["Selectors & Specificity", "Box Model", "Flexbox", "Grid", "Positioning", "Responsive Design & Media Queries", "Animations & Transitions"],
            "JavaScript for the Web": ["DOM Manipulation", "Events", "Fetch API"],
            "Projects": ["Personal Portfolio", "Landing Page", "Responsive Layout Practice"]
        }
    },
    {
        match: t => /\bdsa\b|data structures|algorithm/.test(t),
        sections: {
            "Complexity & Basics": ["Time & Space Complexity", "Big-O Notation", "Recursion", "Arrays & Strings"],
            "Linear Data Structures": ["Linked Lists", "Stacks", "Queues", "Hashing"],
            "Trees & Graphs": ["Binary Trees", "BST", "Heaps", "Tries", "Graph Representation", "BFS & DFS", "Shortest Path (Dijkstra)", "Minimum Spanning Tree"],
            "Algorithms": ["Searching", "Sorting", "Two Pointers & Sliding Window", "Greedy", "Divide & Conquer", "Backtracking", "Dynamic Programming"],
            "Practice": ["Easy Problems", "Medium Problems", "Mock Interviews"]
        }
    },
    {
        match: t => /machine learning|\bml\b|data science|\bnlp\b|deep learning/.test(t),
        sections: {
            "Prerequisites": ["Python Basics", "NumPy & Pandas", "Statistics & Probability", "Linear Algebra Basics"],
            "Core Machine Learning": ["Regression", "Classification", "Decision Trees & Random Forests", "SVM", "Clustering (K-Means)", "Model Evaluation", "Overfitting & Regularization"],
            "Deep Learning": ["Neural Network Basics", "Backpropagation", "CNNs", "RNNs & LSTMs", "Transformers"],
            "NLP": ["Text Preprocessing", "Bag of Words & TF-IDF", "Word Embeddings", "Sentiment & Emotion Analysis", "Named Entity Recognition", "Large Language Models"],
            "Practice": ["Kaggle Datasets", "End-to-end Project", "Model Deployment Basics"]
        }
    }
];

function getSyllabus(title, exam) {
    const t = String(title || '').toLowerCase();
    for (const s of SYLLABI) {
        const hit = (s.exam && exam === s.exam) || (s.match && s.match(t, exam));
        if (hit) {
            return Object.entries(s.sections).map(([name, topics]) =>
                name + '\n' + topics.map((x, i) =>
                    '  ' + (i === topics.length - 1 ? '└' : '├') + '── ' + x
                ).join('\n')
            );
        }
    }
    return null;
}

/* Build the Exam dropdown from SYLLABI so new exams appear automatically. */
function buildExamDropdown() {
    const sel = document.getElementById('goalExam');
    if (!sel) return;
    const options = [['', 'Custom'], ['GATE', 'GATE – CSE']];
    SYLLABI.forEach(s => { if (s.exam) options.push([s.exam, s.examLabel || s.exam]); });
    sel.innerHTML = '';
    options.forEach(([value, label]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = label;
        sel.appendChild(o);
    });
}
buildExamDropdown();