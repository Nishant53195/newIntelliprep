import React, { useState } from "react";
import { previewBulkSubtopics, insertBulkSubtopics,importTopicId } from "../utils/syllabusImporter";

const subjectId = "ethics";

// Supply each existing topicId and its list of subtopics
const bulkSubtopicsPayload = [
  {
    "topicId": "basic-values-ethics",
    "subtopics": [
  {
    "name": "Foundational Conceptual Matrix: Distinctions and Interlinkages among Ethics, Morality, Values, Norms, and Customs",
    "sequence": 0
  },
  {
    "name": "Essence and Determinants of Ethics: Human Agency, Volition, Knowledge, Intention, and Socio-Cultural Conditioning of Action",
    "sequence": 1
  },
  {
    "name": "Dimensions and Theoretical Branches of Ethics: Meta-Ethics, Descriptive Ethics, Normative Frameworks, and Applied Ethics",
    "sequence": 2
  },
  {
    "name": "Philosophical Paradigms of Ethical Study: Western Traditions (Deontology, Teleology/Utilitarianism) vs. Indian Philosophical Schools (Vedic Rta, Dharma, Purusharthas, Nishkama Karma)",
    "sequence": 3
  },
  {
    "name": "Normative Moral Philosophy: Virtue Ethics (Aristotelian Phronesis, Eudaimonia, Cardinal Virtues) vs. Duty-Based (Kantian Categorical Imperative) Traditions",
    "sequence": 4
  },
  {
    "name": "Freedom, Moral Agency, and Discipline: Autonomy of Will, Determinism vs. Free Will, Moral Responsibility, and Ethical Self-Restraint",
    "sequence": 5
  },
  {
    "name": "Jurisprudence of Duties and Rights: Correlative Dynamics of Rights and Obligations, Hohfeldian Framework, Natural Rights vs. Communitarian Obligations",
    "sequence": 6
  },
  {
    "name": "Consequences of Ethics in Human Action: Individual Psychosocial Well-Being, Interpersonal Trust, Institutional Legitimacy, and Social Cohesion",
    "sequence": 7
  },
  {
    "name": "Socialising Institutions and Value Transmission: Crucial Role of Family, Parental Modelling, Value Education, and Intergenerational Ethos",
    "sequence": 8
  },
  {
    "name": "Ethics in Public Life: Nolan Committee Tenets, Democratic Accountability, Fiduciary Trust, and Separation of Private Interest from Public Office",
    "sequence": 9
  },
  {
    "name": "Values and Ethics in Government: Public Trust Doctrine, Legality vs. Conscience, Bureaucratic Neutrality, and Redressal of Administrative Dilemmas",
    "sequence": 10
  },
  {
    "name": "Ethics in Economic Life: Stakeholder Capitalism, Fiduciary Responsibility, Distributive Justice, Corporate Social Responsibility (CSR), and Markets vs. Moral Limits",
    "sequence": 11
  }
]
  },
  {
    "topicId": "human-values-ethics",
    "subtopics": [
  {
    "name": "Human Values & Socialisation Dynamics: Primary vs. Secondary Socialisation, Social Conditioning, Internalisation of Norms & Cultural Transmissibility",
    "sequence": 0
  },
  {
    "name": "Individual Personality & Value Architecture: Trait Theories, Locus of Control, Moral Identity Formation & Psychological Anchors of Personal Values",
    "sequence": 1
  },
  {
    "name": "Taxonomy of Values: Intrinsic/Fundamental vs. Instrumental/Terminal Values (Rokeach Framework) & Hierarchy of Human Needs (Maslow)",
    "sequence": 2
  },
  {
    "name": "Values vs. Skills Nexus: Competency Dilemma, Technical Prowess vs. Moral Compass, Ethical Use of Knowledge & Technocratic Hubris Mitigation",
    "sequence": 3
  },
  {
    "name": "Aesthetic Values & Moral Sensibility: Appreciation of Harmony, Sublimity, Cultural Expression & Intersection of Aesthetics with Moral Development",
    "sequence": 4
  },
  {
    "name": "Societal Institutions in Value Formation: Role of Community, Peer Dynamics, Religious Institutions, Media Platforms & Collective Conscience (Durkheim)",
    "sequence": 5
  },
  {
    "name": "Role of Educational Institutions in Inculcating Values: Formal vs. Hidden Curriculum, Critical Thinking, Teacher as Moral Exemplar & Pedagogy of Empathy",
    "sequence": 6
  },
  {
    "name": "Democratic Values & Constitutional Morality: Liberty, Equality, Fraternity, Justice, Pluralism, Deliberative Participation & Tolerance of Dissent",
    "sequence": 7
  },
  {
    "name": "Values in Work Life & Professional Ethics: Professional Autonomy, Fiduciary Responsibility, Workplace Culture, Conflicts of Conscience & Institutional Loyalty",
    "sequence": 8
  },
  {
    "name": "Role of Ethical Values in Governance & Society: Social Cohesion, Institutional Legitimacy, Rule of Law, Distributive Justice & Containment of Anomie",
    "sequence": 9
  },
  {
    "name": "Significance of Values in Civil Services: Public Trust Doctrine, Discretionary Restraint, Empathy for the Marginalised (Antyodaya), Neutrality & Incorruptibility",
    "sequence": 10
  }
]
  },
  {
    "topicId": "ethics-in-relationships-public-and-private-ethics",
    "subtopics": [
  {
    "name": "Moral Values in Private Relationships: Affective Bonds, Mutual Trust, Fidelity, Filial Obligations, Compassion & Individual Conscience in Kinship/Friendship Networks",
    "sequence": 0
  },
  {
    "name": "Ethical Guidelines in Public Relationships: Contractual Duty, Rule of Law, Objectivity, Procedural Fairness, Accountability & Institutional Integrity",
    "sequence": 1
  },
  {
    "name": "Interconnection & Permeability: Influence of Private Character on Public Action, Conflict of Interest (Nepotism/Cronyism), and Reconciling Personal Loyalty with Public Trust",
    "sequence": 2
  }
]
  },
  {
    "topicId": "attitude-ethics",
    "subtopics": [
  {
    "name": "Structural Components of Attitude: The ABC/CAB Model (Affective, Cognitive, and Behavioural Elements) & Attitudinal Ambivalence",
    "sequence": 0
  },
  {
    "name": "Cognitive Component: Belief Architecture, Knowledge Schemas, Perceptions, and Stereotype Formation",
    "sequence": 1
  },
  {
    "name": "Affective Component: Emotional Valence, Gut Feelings, Physiological Arousal, and Evaluative Reactions",
    "sequence": 2
  },
  {
    "name": "Behavioural Component: Action Tendencies, Intentions, Observable Conduct, and the Attitude-Behaviour Consistency Paradox (LaPiere Experiment)",
    "sequence": 3
  },
  {
    "name": "Functional Foundations of Attitudes (Katz's Typology): Instrumental/Utilitarian/Adjustive Function in Maximising Rewards and Minimising Penalties",
    "sequence": 4
  },
  {
    "name": "Psychological Defensive & Orienting Functions: Ego-Defensive Mechanisms (Projection, Rationalisation), Value-Expressive Outlet, and the Cognitive Knowledge Function (Categorisation & Meaning-Making)",
    "sequence": 5
  },
  {
    "name": "Attitude Formation Paradigms: Classical & Operant Conditioning, Social Learning Theory (Bandura/Modelling), Direct Experience, and the Impact of Foundational Beliefs and Core Values",
    "sequence": 6
  },
  {
    "name": "Social Influence & Conformity Pressures: Normative vs. Informational Social Influence, Compliance, Identification, and Internalisation (Kelman's Framework)",
    "sequence": 7
  },
  {
    "name": "Theories & Routes of Persuasion: Elaboration Likelihood Model (Central vs. Peripheral Routes), Cognitive Dissonance Reduction (Festinger), and Heuristic-Systematic Processing",
    "sequence": 8
  },
  {
    "name": "Tools, Tactics, and Applied Techniques of Persuasion: Source Credibility, Message Framing, Cialdini's Principles of Influence, Subliminal Cues, and Nudge Interventions in Governance",
    "sequence": 9
  },
  {
    "name": "Moral Attitude Formation: Internalisation of Ethos, Moral Reasoning Stages (Kohlberg), Intuitionist Paradigms, and Socialisation Anchors",
    "sequence": 10
  },
  {
    "name": "Political Attitude Formation: Political Socialisation, Ideological Affiliation (Left vs. Right, Liberal vs. Conservative), Partisan Identity, Media Framing, and Democratic Participation",
    "sequence": 11
  }
]
  },
  {
    "topicId": "aptitude-and-foundational-values-of-civil-services-ethics",
    "subtopics": [
  {
    "name": "Essential Aptitude for Civil Servants: Cognitive Capabilities, Problem-Solving Acumen, Emotional Competence, Crisis Navigation & Capacity-Building (Mission Karmayogi Competency Model)",
    "sequence": 0
  },
  {
    "name": "Foundational Values Matrix: Nolan Committee Seven Principles, 2nd ARC Recommendations, Public Trust Doctrine & Constitutional Morality Anchors",
    "sequence": 1
  },
  {
    "name": "Political Neutrality & Non-Partisanship: Independence from Political Ideology, Fair Execution of Successive Governments' Mandates, and Insulation from Partisan Co-optation",
    "sequence": 2
  },
  {
    "name": "Principle of Anonymity: The Permanent Civil Service vs. Temporary Political Executive, Ministerial Responsibility, Working Behind the Scenes, and Restraint in Media/Self-Promotion",
    "sequence": 3
  },
  {
    "name": "Civil Services Accountability & Transparency: Multi-Layered Oversight (Parliamentary, Judicial, CAG, CVC, RTI, Lokpal) & Citizen-Centric Social Audits",
    "sequence": 4
  },
  {
    "name": "Integrity and Probity: Financial and Intellectual Incorruptibility, Moral Courage, Resisting External Coercion, and Rectitude in Discretionary Adjudication",
    "sequence": 5
  },
  {
    "name": "Impartiality and Objectivity: Evidence-Based Decision-Making, Freedom from Bias/Prejudice, Equal Treatment Before Law, and Meritorious Allocation of Public Resources",
    "sequence": 6
  },
  {
    "name": "Tolerance, Empathy, and Compassion for Weaker Sections: Proactive Sensitivity toward Marginalised Communities (SC/ST/OBC/Women/Minorities/PwDs) & Antyodaya Operationalisation",
    "sequence": 7
  },
  {
    "name": "Behavioural Virtues in Bureaucratic Conduct: Humility, Approachability, Demystification of Administrative Authority, and Active Elimination of Feudal Entitlement",
    "sequence": 8
  },
  {
    "name": "Dynamic Resilience: Adaptability, Agile Governance, Technological Integration, and Perseverance against Bureaucratic Inertia and Complex Structural Hurdles",
    "sequence": 9
  },
  {
    "name": "Contribution to Society and Public Good: Fostering Inclusive Growth, Democratic Deepening, Human Development Outcomes, and Realising the Preamble's Socio-Economic Justice Vision",
    "sequence": 10
  }
]
  },
  {
    "topicId": "emotional-intelligence-ethics",
    "subtopics": [
  {
    "name": "Classical Theoretical Models of Emotional Intelligence: Salovey-Mayer Ability Model (Perceiving, Using, Understanding, and Managing Emotions)",
    "sequence": 0
  },
  {
    "name": "Mixed & Trait Paradigms of Emotional Intelligence: Daniel Goleman's Competency Model (Self-Awareness, Self-Regulation, Motivation, Empathy, Social Skills), Bar-On's EQ-i Model & Petrides' Trait EI Framework",
    "sequence": 1
  },
  {
    "name": "Neurobiological Foundations of Emotion: The Limbic System, Amygdala Hijack vs. Prefrontal Cortex Regulation, and Neural Plasticity",
    "sequence": 2
  },
  {
    "name": "Malleability and Cultivability of Emotional Intelligence: Nature vs. Nurture Debate, Cognitive Reappraisal, Mindfulness-Based Emotional Regulation & Experiential Learning",
    "sequence": 3
  },
  {
    "name": "Pedagogical & Institutional Techniques for Cultivating EI: T-Groups, Sensitivity Training, 360-Degree Feedback, Simulation-Based Stress Inoculation & Civil Services Mid-Career Training Modules",
    "sequence": 4
  }
]
  },
  {
    "topicId": "emotional-competencies-ethics",
    "subtopics": [
  {
    "name": "The Self-Awareness Domain: Emotional Self-Awareness, Accurate Self-Assessment, Recognizing Triggers and Biases, and Grounded Self-Confidence",
    "sequence": 0
  },
  {
    "name": "The Self-Management Domain: Emotional Self-Control, Impulse Regulation, Adaptability, Conscientiousness, Achievement Drive, and Optimism under Stress",
    "sequence": 1
  },
  {
    "name": "The Social Awareness Domain: Empathy (Cognitive vs. Affective), Organizational Awareness, Reading Interpersonal Dynamics, and Systemic Attunement to Community Needs",
    "sequence": 2
  },
  {
    "name": "The Relationship Management Domain: Inspirational Leadership, Influence, Conflict De-escalation, Change Catalysis, and Fostering Collaborative Networks",
    "sequence": 3
  },
  {
    "name": "Significance of Emotional Intelligence in the Workplace: Team Cohesion, Toxic Culture Mitigation, Stress Management, Constructive Feedback, and Organizational Productivity",
    "sequence": 4
  },
  {
    "name": "Operational Role of Emotional Intelligence in Civil Services: Managing Public Outrage, Law-and-Order De-escalation, Humane Grievance Redressal, Bureaucratic Burnout Prevention, and Empathetic Governance",
    "sequence": 5
  }
]
  },
  {
    "topicId": "india-world-thinkers-ethics",
    "subtopics": [
      {
        "name": "Classical Western Ethical Thinkers: Socrates (Dialectic Method), Plato (Cardinal Virtues), Aristotle (Golden Mean & Nicomachean Ethics)",
        "sequence": 0
      },
      {
        "name": "Modern Western Traditions: Deontology (Kant's Categorical Imperative), Utilitarianism (Bentham, Mill), Social Contract (Hobbes, Locke, Rousseau) & Justice (Rawls)",
        "sequence": 1
      },
      {
        "name": "Ancient Indian Ethical Traditions: Vedic Ethics (Rta and Satya), Upanishadic Wisdom, Buddhist Ethics (Eightfold Path), Jain Ethics (Pancha Mahavratas) & Gita's Nishkama Karma",
        "sequence": 2
      },
      {
        "name": "Political Realism and Statecraft Ethics: Kautilya’s Arthashastra (Raja Dharma, Yogakshema, Matsya Nyaya vs. Danda)",
        "sequence": 3
      },
      {
        "name": "Modern Indian Social and Political Reformers: Swami Vivekananda (Practical Vedanta), Rabindranath Tagore (Universal Humanism), M.K. Gandhi (Sarvodaya, Trusteeship, Seven Sins) & B.R. Ambedkar (Social Democracy, Annihilation of Caste)",
        "sequence": 4
      }
    ]
  },
  {
    "topicId": "values-ethics-in-public-administration-ethics",
    "subtopics": [
  {
    "name": "Ethical Concerns in Public Institutions: Misuse of Discretionary Powers, Rent-Seeking, Patronage Networks, Administrative Secrecy & Erosion of Public Trust",
    "sequence": 0
  },
  {
    "name": "Ethical Concerns in Private Institutions: Unbridled Profit Maximisation, Exploitative Labour Practices, Creative Accounting, Monopolistic Distortions & Environmental Externalities",
    "sequence": 1
  },
  {
    "name": "Ethical Dilemmas in Public and Private Institutions: Discretion vs. Rule-Bound Rigidity, Whistleblowing vs. Organizational Loyalty, Confidentiality vs. Transparency & Public Good vs. Private Profit",
    "sequence": 2
  },
  {
    "name": "Sources of Ethical Guidance: Hierarchy and Limits of Laws, Rules, and Regulations; Letter vs. Spirit of the Law; Role of Conscience and the Moral Compass",
    "sequence": 3
  },
  {
    "name": "Accountability and Ethical Governance Mechanisms: Horizontal Oversight (C&AG, Judiciary, CVC, Lokpal) vs. Vertical Accountability (Elections, RTI, Social Audits, Citizen's Charters)",
    "sequence": 4
  },
  {
    "name": "Strengthening Ethical and Moral Values in Governance: Second ARC Recommendations, Values-Based Civil Service Recruitment, Capacity Building (Mission Karmayogi) & Protection for Whistleblowers",
    "sequence": 5
  },
  {
    "name": "Moral Judgements and Ethics in International Relations: Realism (Morgenthau) vs. Idealism, Just War Theory (Jus ad Bellum, Jus in Bello), Humanitarian Intervention & Sovereignty vs. R2P (Responsibility to Protect)",
    "sequence": 6
  },
  {
    "name": "Ethical Dimensions of International Aid and Funding: Conditionalities, Structural Adjustment Programmes, Debt-Trap Diplomacy vs. Genuine Development Assistance & Global North-South Hegemony",
    "sequence": 7
  },
  {
    "name": "The Concept of Moral Responsibility in Global Governance: Common but Differentiated Responsibilities (CBDR), Refugee Burden-Sharing, Reparations & Historical Injustices",
    "sequence": 8
  },
  {
    "name": "Ethics in the Working of International Organisations: Asymmetric Power Dynamics in UN/UNSC Veto, Democratic Deficits in Bretton Woods Institutions (IMF/World Bank), and Equitable Access to Global Commons",
    "sequence": 9
  },
  {
    "name": "Foundations of Corporate Governance: Concept, Cadbury Committee Principles, Fiduciary Duty, Board Independence, Minority Shareholder Rights & Prevention of Corporate Frauds",
    "sequence": 10
  },
  {
    "name": "Concept and Paradigms of Business Ethics: Shareholder Primacy (Friedman) vs. Stakeholder Capitalism (Freeman), Fair Trade, Ethical Supply Chains & Whistleblowing Mechanisms",
    "sequence": 11
  },
  {
    "name": "Models of Corporate Social Responsibility (CSR): Ethical/Philanthropic Model, Statist Model, Liberal Model & Stakeholder Model (Carroll's CSR Pyramid)",
    "sequence": 12
  },
  {
    "name": "Regulatory and Statutory Architecture of Corporate Governance in India: Companies Act 2013 (Section 135 CSR Mandate), SEBI (LODR) Regulations, Kotak Committee Recommendations & NFRA Oversight",
    "sequence": 13
  }
]
  },
  {
    "topicId": "probity-in-governance-ethics",
    "subtopics": [
  {
    "name": "The Concept of Public Service & Philosophical Basis of Governance: Public Trust Doctrine, Social Contract Foundations, Fiduciary Responsibility & Ethical Grounds of Political Obligation",
    "sequence": 0
  },
  {
    "name": "Information Sharing, Open Governance & Right to Information (RTI): Statutory Foundations (RTI Act 2005), Section 4 Proactive Disclosure, Culture of Transparency vs. Official Secrets Act (OSA)",
    "sequence": 1
  },
  {
    "name": "Structural Weaknesses in the RTI Regime & Enhancement Measures: Information Commission Vacancies and Pendency, Whistleblower Targeting, Section 8 Exemption Ambiguities & Digitisation of Public Records",
    "sequence": 2
  },
  {
    "name": "Vigilant Citizenry, Participatory Governance & Accountability: Citizen Oversight, Public Hearings (Jan Sunwai), Participatory Budgeting, Social Audits & Informed Democratic Agency",
    "sequence": 3
  },
  {
    "name": "Normative Ethical Charters: Concept and Significance of Code of Ethics vs. Code of Conduct, Professional Ethics (Legal, Medical, Engineering) & Fostering Internal Moral Compliance",
    "sequence": 4
  },
  {
    "name": "Institutional Codes of Conduct Across Public Organs: Guidelines for Ministers and Legislators (Ethics Committees), Central Civil Services (Conduct) Rules 1964, Regulators & Judicial Independence/Restraint Principles",
    "sequence": 5
  },
  {
    "name": "Citizen's Charters Paradigm: Core Components (Vision, Mission, Entitlements, Timeframes, Grievance Recourse), Formulation Methodologies, Indian Implementation Gaps & Sevottam Model Integration",
    "sequence": 6
  },
  {
    "name": "Foundations and Dynamics of Work Culture: Organizational Climate, Norms of Performance and Punctuality, Bureaucratic Inertia vs. Result-Orientation, Indian Cultural Perspectives (Karma Yoga & Duty)",
    "sequence": 7
  },
  {
    "name": "Interventions for Transforming Public Work Culture: Performance-Linked Appraisals, Streamlining Hierarchical Layers, Mission Karmayogi, Collaborative Leadership & Demystifying Official Authority",
    "sequence": 8
  },
  {
    "name": "Quality of Public Service Delivery & Grievance Redressal: Citizen-Centric Benchmarking, Service Level Agreements (SLAs), Right to Public Services Legislation & Integrated Grievance Platforms (CPGRAMS)",
    "sequence": 9
  },
  {
    "name": "Fiscal Probity & Efficient Utilisation of Public Funds: Budgetary Principles, Value-for-Money Audits, Social Returns on Expenditure, Procurement Transparency (GeM Platform) & Prevention of Misappropriation",
    "sequence": 10
  },
  {
    "name": "Expenditure Bottlenecks & Parliamentary Financial Oversight: Absorptive Capacity Deficits, March Rush Syndrome, Parking of Scheme Funds, Role of PAC, Estimates Committee & C&AG Performance Audits",
    "sequence": 11
  },
  {
    "name": "Anatomy, Extent & Nature of Corruption in India: Coercive vs. Collusive Corruption, Policy Capture, Petty vs. Grand Corruption, Cronyism & Economic Externalities of Graft",
    "sequence": 12
  },
  {
    "name": "Corruption as a Systemic & Social Malady: Normalisation of Illicit Exchanges, Subversion of Rule of Law, Distributive Injustice, Deepening Inequality & Degradation of Social Fabric",
    "sequence": 13
  },
  {
    "name": "Bureaucratic Misconduct & Abuse of Authority: Discretionary Rent-Seeking, Benami Assets, Quid Pro Quo Postings, Criminal Misconduct Definitions & Integrity Testing Mechanisms",
    "sequence": 14
  },
  {
    "name": "Exposing Corruption, Civil Society & Whistleblower Protection: Investigative Journalism, Civil Society Exposés, Whistle Blowers Protection Act, Anonymous Complaints Dilemma & Witness Safeguards",
    "sequence": 15
  },
  {
    "name": "Institutional Anti-Corruption Architecture: Prevention of Corruption Act (POCA - 2018 Amendments), Lokpal and Lokayuktas, Central Vigilance Commission (CVC), CBI & Enforcement Directorate",
    "sequence": 16
  },
  {
    "name": "Multi-Pronged Counter-Corruption Strategies & Effectiveness: Preventive vs. Punitive Vigilance, Administrative Simplification, Faceless Digital Interventions (DBT), Systemic Deregulation & International Best Practices",
    "sequence": 17
  }
]
  },
  {
    "topicId": "applied-ethics-ethics",
    "subtopics": [
  {
    "name": "Bioethics & End-of-Life Decisions: Euthanasia Debate (Active vs. Passive), Doctrine of Double Effect, Palliative Care, Living Wills & Right to Die with Dignity (Common Cause Ruling)",
    "sequence": 0
  },
  {
    "name": "Reproductive Ethics & Assisted Technologies: Commercial vs. Altruistic Surrogacy, Bodily Autonomy, Commodification of Wombs, Surrogacy (Regulation) Act & Rights of the Child",
    "sequence": 1
  },
  {
    "name": "Ethical Issues in Biotechnology & Genetic Engineering: Germline Editing (CRISPR-Cas9), Designer Babies, Transgenic Organisms, Biopiracy & Somatic vs. Reproductive Cloning",
    "sequence": 2
  },
  {
    "name": "Environmental & Ecological Ethics: Anthropocentrism vs. Ecocentrism/Biocentrism, Deep Ecology, Land Ethic (Aldo Leopold), Intergenerational Equity & Climate Justice",
    "sequence": 3
  },
  {
    "name": "Animal Ethics & Sentience: Moral Status of Non-Human Animals, Specieism (Peter Singer), Vivisection & Animal Experimentation, Factory Farming & Prevention of Cruelty to Animals (PCA Act)",
    "sequence": 4
  },
  {
    "name": "Ethics in Sports & Athletics: Spirit of Fair Play, Doping (WADA Regimes), Gene Doping, Hyperandrogenism Controversies, Commercialisation & Integrity of Athletic Competition",
    "sequence": 5
  },
  {
    "name": "Media Ethics & Fourth Estate Governance: Trial by Media, Sensationalism & TRP Manipulation, Paid News, Fake News/Disinformation Ecosystems, Right to Privacy vs. Public Interest",
    "sequence": 6
  },
  {
    "name": "Corporate Governance & Ethical Business Conduct: Fiduciary Responsibility, Stakeholder Theory vs. Shareholder Primacy, CSR Mandates, Whistleblower Protections & Fair Competition",
    "sequence": 7
  },
  {
    "name": "Child Labour & Human Rights: Moral Dimension of Exploitative Labour, Structural Poverty vs. Rights Deprivation, Right to Education (Art. 21A), and Child and Adolescent Labour (Prohibition and Regulation) Act",
    "sequence": 8
  },
  {
    "name": "Juvenile Justice & Age of Criminal Responsibility: Treating Minors as Adults in Heinous Crimes, Retributive Justice vs. Reformative Rehabilitation, Cognitive Immaturity & Juvenile Justice (JJ) Act Framework",
    "sequence": 9
  }
]
  }
];

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    previewBulkSubtopics(subjectId, bulkSubtopicsPayload);

    const isConfirmed = window.confirm(
      "Inspect the browser console (F12) to review all subtopics.\n\nProceed with writing subtopics to Firestore?"
    );

    if (!isConfirmed) return;

    setLoading(true);
    try {
      await insertBulkSubtopics(subjectId, bulkSubtopicsPayload);
      alert("All subtopics uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportTopic = async () => {
    importTopicId(subjectId);

    const isConfirmed = window.confirm(
      "Inspect the browser console (F12) to review all subtopics.\n\nProceed with writing subtopics to Firestore?"
    );

    if (!isConfirmed) return;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Bulk Subtopic Importer</h2>
      <p>Target Subject: <strong>{subjectId}</strong></p>
      <button onClick={handleImport} disabled={loading}>
        {loading ? "Uploading Subtopics..." : "Preview & Bulk Upload Subtopics"}
      </button>

      <h2>Bulk Topic Id Importer</h2>
      <p>Target Subject: <strong>{subjectId}</strong></p>
      <button onClick={handleImportTopic} disabled={loading}>
        {loading ? "Uploading topics..." : "Preview & Bulk Upload Subtopics"}
      </button>
    </div>
  );
}