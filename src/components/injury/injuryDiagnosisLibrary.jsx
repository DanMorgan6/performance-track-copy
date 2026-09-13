export const injuryDiagnosisLibrary = {
  "config_name": "injury_diagnosis_library",
  "version": "1.1",
  "global": {
    "confirm_status": {
      "key": "confirmed_status",
      "label": "Confirmation status",
      "type": "enum",
      "options": ["suspected", "confirmed"],
      "default": "suspected"
    },
    "severity_generic": {
      "key": "severity",
      "label": "Severity",
      "type": "enum",
      "options": ["irritation", "sprain", "partial_tear", "full_thickness_tear", "rupture"],
      "optional": true
    },
    "muscle_grading": {
      "key": "muscle_grade",
      "label": "Muscle grading",
      "type": "object",
      "optional": true,
      "fields": [
        {
          "key": "system",
          "label": "Classification system",
          "type": "enum",
          "options": ["BAMIC", "PEDRET_US"]
        },
        {
          "key": "grade",
          "label": "Grade",
          "type": "string",
          "hint": "e.g., 1a, 2b"
        },
        {
          "key": "mechanism",
          "label": "Mechanism",
          "type": "enum",
          "options": ["running", "stretching"],
          "optional": true
        }
      ]
    },
    "laterality": {
      "key": "side",
      "label": "Side",
      "type": "enum",
      "options": ["left", "right", "bilateral", "midline"],
      "default": "left"
    },
    "spine_level": {
      "key": "level",
      "label": "Level",
      "type": "string",
      "optional": true,
      "hint": "e.g., L4/5, L5/S1, C5/6"
    },
    "disc_details": {
      "key": "disc_details",
      "label": "Disc details",
      "type": "object",
      "optional": true,
      "fields": [
        {
          "key": "morphology",
          "label": "Morphology",
          "type": "enum",
          "options": ["bulge", "protrusion", "extrusion", "sequestration"]
        },
        {
          "key": "location",
          "label": "Location",
          "type": "enum",
          "options": ["central", "paracentral", "foraminal", "extraforaminal"],
          "optional": true
        },
        {
          "key": "level",
          "label": "Level",
          "type": "string",
          "optional": true
        }
      ]
    },
    "oa_compartment_knee": {
      "key": "oa_compartment",
      "label": "OA compartment",
      "type": "enum",
      "options": ["pfj", "medial", "lateral", "tricompartmental"],
      "optional": true
    },
    "hip_impingement_type": {
      "key": "impingement_type",
      "label": "FAI type",
      "type": "enum",
      "options": ["cam", "pincer", "mixed"],
      "optional": true
    },
    "meniscus_details": {
      "key": "meniscus_details",
      "label": "Meniscus tear details",
      "type": "object",
      "optional": true,
      "fields": [
        {
          "key": "location",
          "label": "Location",
          "type": "enum",
          "options": ["anterior_horn", "body", "posterior_horn", "root"],
          "optional": true
        },
        {
          "key": "zone",
          "label": "Zone",
          "type": "enum",
          "options": ["red_red", "red_white", "white_white"],
          "optional": true
        },
        {
          "key": "tear_type",
          "label": "Tear morphology",
          "type": "enum",
          "options": ["radial", "longitudinal_vertical", "horizontal", "oblique_parrot_beak", "complex", "degenerative"]
        },
        {
          "key": "bucket_handle",
          "label": "Bucket-handle",
          "type": "boolean",
          "optional": true
        },
        {
          "key": "displaced",
          "label": "Displaced fragment",
          "type": "boolean",
          "optional": true
        }
      ]
    }
  },
  "picklists": {
    "foot_joints": [
      "tibiotalar_ankle",
      "subtalar",
      "talonavicular",
      "calcaneocuboid",
      "naviculocuneiform",
      "mtp_1",
      "mtp_2",
      "mtp_3",
      "mtp_4",
      "mtp_5"
    ],
    "wrist_hand_bones_joints": [
      "distal_radius",
      "distal_ulna",
      "radiocarpal",
      "scaphoid",
      "lunate",
      "triquetrum",
      "metacarpal_1",
      "metacarpal_2",
      "metacarpal_3",
      "metacarpal_4",
      "metacarpal_5"
    ]
  },
  "regions": [
    {
      "region_key": "foot_ankle",
      "label": "Foot & Ankle",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "ligaments",
          "label": "Ligaments",
          "items": [
            { "issue_key": "atfl_injury", "label": "ATFL injury", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "cfl_injury", "label": "CFL injury", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "deltoid_complex_injury", "label": "Deltoid complex injury", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "syndesmosis_injury", "label": "Syndesmosis / AITFL injury", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "tendons",
          "label": "Tendons / Fascia",
          "items": [
            { "issue_key": "achilles_issue", "label": "Achilles tendon (tendinopathy/tear/rupture)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "plantar_fascia_issue", "label": "Plantar fascia (fasciopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "peroneal_issue", "label": "Peroneal tendinopathy", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "joint_bone",
          "label": "Joint / Bone",
          "items": [
            { "issue_key": "ankle_oa", "label": "Ankle OA", "modifiers": ["confirm_status"] },
            { "issue_key": "olt_talus", "label": "Osteochondral lesion of talus", "modifiers": ["confirm_status"] },
            { "issue_key": "lisfranc_injury", "label": "Lisfranc injury", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        }
      ]
    },
    {
      "region_key": "lower_leg",
      "label": "Lower leg",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "muscle",
          "label": "Muscle",
          "items": [
            { "issue_key": "calf_strain", "label": "Calf strain/tear (gastroc/soleus)", "modifiers": ["confirm_status", "muscle_grading"] },
            { "issue_key": "plantaris_issue", "label": "Plantaris strain/tear", "modifiers": ["confirm_status", "muscle_grading"] }
          ]
        },
        {
          "group_key": "bone",
          "label": "Bone",
          "items": [
            { "issue_key": "mtss", "label": "Medial tibial stress syndrome (shin splints)", "modifiers": ["confirm_status"] },
            { "issue_key": "tibial_stress_fracture", "label": "Tibial stress fracture", "modifiers": ["confirm_status"] },
            { "issue_key": "fibular_stress_fracture", "label": "Fibular stress fracture", "modifiers": ["confirm_status"] }
          ]
        }
      ]
    },
    {
      "region_key": "knee",
      "label": "Knee",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "ligament",
          "label": "Ligament",
          "items": [
            { "issue_key": "acl_injury", "label": "ACL (sprain/tear/rupture)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "mcl_injury", "label": "MCL (sprain/tear/rupture)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "lcl_injury", "label": "LCL (sprain/tear/rupture)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "pcl_injury", "label": "PCL (sprain/tear/rupture)", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "meniscus",
          "label": "Meniscus",
          "items": [
            { "issue_key": "medial_meniscus_tear", "label": "Medial meniscus tear", "modifiers": ["confirm_status", "meniscus_details"] },
            { "issue_key": "lateral_meniscus_tear", "label": "Lateral meniscus tear", "modifiers": ["confirm_status", "meniscus_details"] }
          ]
        },
        {
          "group_key": "joint",
          "label": "Joint / OA",
          "items": [
            { "issue_key": "knee_oa", "label": "Knee osteoarthritis", "modifiers": ["confirm_status", "oa_compartment_knee"] },
            { "issue_key": "chondral_defect", "label": "Chondral defect / chondromalacia", "modifiers": ["confirm_status"] }
          ]
        },
        {
          "group_key": "other",
          "label": "Other",
          "items": [
            { "issue_key": "pfps", "label": "Patellofemoral pain syndrome", "modifiers": ["confirm_status"] }
          ]
        }
      ]
    },
    {
      "region_key": "hip_groin",
      "label": "Hip / Groin",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "joint_labrum",
          "label": "Joint / Labrum / FAI",
          "items": [
            { "issue_key": "labral_tear", "label": "Labral tear", "modifiers": ["confirm_status"] },
            { "issue_key": "fai", "label": "Femoroacetabular impingement", "modifiers": ["confirm_status", "hip_impingement_type"] },
            { "issue_key": "hip_oa", "label": "Hip osteoarthritis", "modifiers": ["confirm_status"] }
          ]
        },
        {
          "group_key": "tendon_bursa",
          "label": "Tendon / Bursa",
          "items": [
            { "issue_key": "gtps", "label": "Greater trochanteric pain syndrome (GTPS)", "modifiers": ["confirm_status"] },
            { "issue_key": "gluteal_tear", "label": "Gluteus medius/minimus tear", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "groin",
          "label": "Groin",
          "items": [
            { "issue_key": "adductor_strain", "label": "Adductor strain", "modifiers": ["confirm_status", "muscle_grading"] }
          ]
        }
      ]
    },
    {
      "region_key": "lumbar_sacrum",
      "label": "Lumbar spine / Sacrum",
      "default_sides": ["midline", "left", "right"],
      "groups": [
        {
          "group_key": "spine",
          "label": "Spine diagnoses",
          "items": [
            { "issue_key": "nsmlbp", "label": "Non-specific mechanical low back pain", "modifiers": ["confirm_status"] },
            { "issue_key": "facet_arthropathy_lumbar", "label": "Facet joint syndrome/arthropathy", "modifiers": ["confirm_status"] },
            { "issue_key": "lumbar_radiculopathy", "label": "Lumbar radiculopathy", "modifiers": ["confirm_status", "spine_level"] },
            { "issue_key": "discogenic_lumbar", "label": "Discogenic pain", "modifiers": ["confirm_status", "disc_details"] }
          ]
        }
      ]
    },
    {
      "region_key": "thoracic_spine",
      "label": "Thoracic spine",
      "default_sides": ["midline", "left", "right"],
      "groups": [
        {
          "group_key": "spine",
          "label": "Spine diagnoses",
          "items": [
            { "issue_key": "facet_arthropathy_thoracic", "label": "Facet joint syndrome/arthropathy", "modifiers": ["confirm_status"] },
            { "issue_key": "thoracic_radiculopathy", "label": "Thoracic radiculopathy", "modifiers": ["confirm_status", "spine_level"] }
          ]
        }
      ]
    },
    {
      "region_key": "cervical_spine",
      "label": "Cervical spine",
      "default_sides": ["midline", "left", "right"],
      "groups": [
        {
          "group_key": "spine",
          "label": "Spine diagnoses",
          "items": [
            { "issue_key": "cervical_radiculopathy", "label": "Cervical radiculopathy", "modifiers": ["confirm_status", "spine_level"] },
            { "issue_key": "cervical_myelopathy", "label": "Cervical myelopathy", "modifiers": ["confirm_status", "spine_level"] }
          ]
        }
      ]
    },
    {
      "region_key": "shoulder",
      "label": "Shoulder",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "instability",
          "label": "Instability",
          "items": [
            { "issue_key": "shoulder_dislocation", "label": "Subluxation/dislocation", "modifiers": ["confirm_status"] },
            { "issue_key": "acj_sprain", "label": "ACJ sprain", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "rotator_cuff",
          "label": "Rotator cuff",
          "items": [
            { "issue_key": "supraspinatus_issue", "label": "Supraspinatus (tendinopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "infraspinatus_issue", "label": "Infraspinatus (tendinopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "subscapularis_issue", "label": "Subscapularis (tendinopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        },
        {
          "group_key": "bursa_impingement",
          "label": "Bursa / Impingement",
          "items": [
            { "issue_key": "subacromial_bursitis", "label": "Subacromial bursitis", "modifiers": ["confirm_status"] },
            { "issue_key": "subacromial_impingement", "label": "Subacromial impingement", "modifiers": ["confirm_status"] }
          ]
        }
      ]
    },
    {
      "region_key": "elbow",
      "label": "Elbow",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "tendon",
          "label": "Tendon",
          "items": [
            { "issue_key": "lateral_epicondylalgia", "label": "Lateral epicondylalgia (tendinopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] },
            { "issue_key": "medial_epicondylalgia", "label": "Medial epicondylalgia (tendinopathy/tear)", "modifiers": ["confirm_status", "severity_generic"] }
          ]
        }
      ]
    },
    {
      "region_key": "wrist_hand",
      "label": "Wrist & Hand",
      "default_sides": ["left", "right"],
      "groups": [
        {
          "group_key": "tendon",
          "label": "Tendon",
          "items": [
            { "issue_key": "de_quervains", "label": "De Quervain's tenosynovitis", "modifiers": ["confirm_status"] }
          ]
        },
        {
          "group_key": "nerve",
          "label": "Nerve",
          "items": [
            { "issue_key": "carpal_tunnel", "label": "Carpal tunnel syndrome", "modifiers": ["confirm_status"] }
          ]
        }
      ]
    }
  ]
};