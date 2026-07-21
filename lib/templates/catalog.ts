/**
 * The built-in card-template catalogue — names, categories and badges.
 *
 * Split out of app/(app)/templates/page.tsx so the creation wizard can name the
 * template an organizer picked without pulling in the ~750-line SVG builder.
 *
 * Category counts are DERIVED here, never hand-written. The hardcoded counts on
 * the chips had drifted from the list (Conferences claimed 7 with 8 entries;
 * Creative claimed 3 with 2), so the filter visibly disagreed with itself.
 */

export interface CatalogTemplate {
  id: string;
  name: string;
  cat: string;
  catLabel: string;
  badge: 'POPULAR' | 'NEW' | null;
}

export const TEMPLATES: CatalogTemplate[] = [
  { id:'atf',       name:'Africa Tech Festival',      cat:'conference', catLabel:'CONFERENCE', badge:'POPULAR' },
  { id:'sunrise',   name:'Sunrise Hackathon',          cat:'tech',       catLabel:'HACKATHON',  badge:'NEW'     },
  { id:'devfest',   name:'Devfest Lagos',              cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'gala',      name:'Black Tie Gala',             cat:'conference', catLabel:'GALA',       badge:null      },
  { id:'founders',  name:'Founders Retreat',           cat:'workshop',   catLabel:'WORKSHOP',   badge:null      },
  { id:'nile',      name:'The Nile Forum',             cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'womentech', name:'Women in Tech Summit',       cat:'tech',       catLabel:'SUMMIT',     badge:'NEW'     },
  { id:'ai',        name:'AI Ethics Webinar',          cat:'webinar',    catLabel:'WEBINAR',    badge:'NEW'     },
  { id:'studio',    name:'Studio Sessions',            cat:'workshop',   catLabel:'WORKSHOP',   badge:null      },
  { id:'sahara',    name:'Sahara Leadership Summit',   cat:'conference', catLabel:'SUMMIT',     badge:null      },
  { id:'harvest',   name:'Harvest Festival',           cat:'music',      catLabel:'FESTIVAL',   badge:null      },
  { id:'agora',     name:'Agora Open Forum',           cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'pulse',     name:'Pulse Music Fest',           cat:'music',      catLabel:'MUSIC',      badge:'POPULAR' },
  { id:'nights',    name:'Lagos Nights',               cat:'music',      catLabel:'MUSIC',      badge:null      },
  { id:'chrome',    name:'Chrome Dev Summit',          cat:'tech',       catLabel:'SUMMIT',     badge:null      },
  { id:'cosmos',    name:'Cosmos Leadership Forum',    cat:'conference', catLabel:'FORUM',      badge:null      },
  { id:'faith',     name:'Faith Conference',           cat:'ngo',        catLabel:'RELIGIOUS',  badge:null      },
  { id:'arctic',    name:'Arctic Tech Conference',     cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'run',       name:'Run Lagos 10K',              cat:'sport',      catLabel:'SPORT',      badge:null      },
  { id:'terra',     name:'Terra Climate Summit',       cat:'ngo',        catLabel:'SUMMIT',     badge:'NEW'     },
  { id:'sea',       name:'Devs at Sea',                cat:'tech',       catLabel:'CONFERENCE', badge:null      },
  { id:'zen',       name:'Zen Wellness Summit',        cat:'workshop',   catLabel:'WELLNESS',   badge:null      },
  { id:'bloom',     name:"Bloom Women's Forum",        cat:'ngo',        catLabel:'FORUM',      badge:'NEW'     },
  { id:'editorial', name:'The Press Forum',            cat:'conference', catLabel:'MEDIA',      badge:null      },
  { id:'marathon',  name:'Design Marathon',            cat:'creative',   catLabel:'CREATIVE',   badge:'NEW'     },
  { id:'prism',     name:'Prism Design Week',          cat:'creative',   catLabel:'DESIGN',     badge:null      },
  { id:'pitch',     name:'The Pitch Competition',      cat:'tech',       catLabel:'STARTUP',    badge:null      },
  { id:'volta',     name:'Volta Gaming Expo',          cat:'tech',       catLabel:'GAMING',     badge:'POPULAR' },
  { id:'century',   name:'Century Business Forum',     cat:'conference', catLabel:'BUSINESS',   badge:null      },
  { id:'sport100',  name:'100 Days to Kickoff',        cat:'sport',      catLabel:'SPORT',      badge:null      },
];

const CATEGORY_LABELS: { key: string; label: string }[] = [
  { key:'tech',       label:'Tech & Startup'   },
  { key:'conference', label:'Conferences'      },
  { key:'music',      label:'Music & Culture'  },
  { key:'workshop',   label:'Workshops'        },
  { key:'webinar',    label:'Webinars'         },
  { key:'sport',      label:'Sport'            },
  { key:'ngo',        label:'NGO / Religious'  },
  { key:'creative',   label:'Creative & Design'},
];

/** Chips for the /templates filter bar, with counts derived from TEMPLATES. */
export const CATEGORIES: { key: string; label: string; count: number }[] = [
  { key: 'all', label: 'All', count: TEMPLATES.length },
  ...CATEGORY_LABELS.map(c => ({
    ...c,
    count: TEMPLATES.filter(t => t.cat === c.key).length,
  })),
];

/**
 * Human name for a template id, for confirming the pick in the creation wizard.
 * Returns null for admin-managed `db:` ids, whose names live in the database.
 */
export function templateName(id: string): string | null {
  return TEMPLATES.find(t => t.id === id)?.name ?? null;
}
