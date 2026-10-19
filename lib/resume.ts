// Resume content for /resume. Employers are described by kind rather than by
// name: this repo is public and never carries employer or customer names.

export type Role = {
  title: string;
  start: string;
  end?: string;
  summary?: string;
};

export type Position = {
  org: string;
  location: string;
  roles: Role[];
};

export const resume = {
  name: "Nick Prignano",
  headline: "Principal Technical Consultant",
  location: "Greater Chicago Area",
  summary:
    "I lead architecture and delivery for Azure Virtual Desktop, enterprise Microsoft 365 and tenant migration, and enterprise AI enablement and adoption.",
  links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/nickprignano" }],
  skills: [
    "Azure Virtual Desktop",
    "Windows 365",
    "Windows 11",
    "Microsoft 365 and Entra",
    "Tenant migration",
    "Enterprise AI enablement",
    "Automation and infrastructure as code",
    "End-user computing",
    "Citrix Virtual Apps and Desktops",
    "VMware Horizon and Workspace ONE",
    "Amazon WorkSpaces and AppStream 2.0",
  ],
  experience: [
    {
      org: "Global IT consultancy",
      location: "Chicago, IL",
      roles: [
        {
          title: "Principal Technical Consultant",
          start: "Feb 2020",
          summary:
            "Lead architecture and delivery teams for Azure Virtual Desktop, enterprise Microsoft 365 and Entra, and complex migration engagements.",
        },
        {
          title: "Senior Solutions Architect",
          start: "Jul 2019",
          end: "Feb 2020",
          summary:
            "Technical team lead on strategic enterprise end-user computing projects across the data center and public cloud practices. Technical lead for earning the AWS End User Computing Competency as one of its four original launch partners.",
        },
        {
          title: "Specialist Sales Engineer",
          start: "Oct 2018",
          end: "Jun 2019",
          summary:
            "Primary presales specialist for end-user computing, helping sales teams nationwide plan migrations to VMware Workspace ONE, Horizon and Horizon Cloud, and Amazon WorkSpaces and AppStream.",
        },
        {
          title: "Senior Data Center Engineer",
          start: "Jul 2016",
          end: "Oct 2018",
          summary:
            "Technical lead for Citrix Virtual Apps and Desktops consulting, especially in healthcare. End-user computing lead for Amazon WorkSpaces and AppStream 2.0 design and deployment.",
        },
      ],
    },
    {
      org: "National IT services firm",
      location: "Bannockburn, IL",
      roles: [
        {
          title: "Solution Architect",
          start: "Oct 2014",
          end: "Jul 2016",
          summary:
            "Lead delivery architect for Citrix in the national professional services practice, delivering virtualization, networking and mobility solutions across industries.",
        },
      ],
    },
    {
      org: "IT consulting firm",
      location: "Chicago, IL",
      roles: [
        {
          title: "Technical Architect",
          start: "Oct 2013",
          end: "Oct 2014",
          summary: "Pre- and post-sales design, implementation and assessments for Citrix and Remote Desktop Services.",
        },
      ],
    },
    {
      org: "Online tech university",
      location: "Oak Brook, IL",
      roles: [
        {
          title: "Citrix Engineer",
          start: "Oct 2012",
          end: "Oct 2013",
          summary:
            "Lead Citrix engineer for a hybrid-cloud student lab platform, designing a long-term strategy to deliver desktops and apps to a global user base from public cloud.",
        },
      ],
    },
    {
      org: "Government contracting",
      location: "Tennessee",
      roles: [
        {
          title: "Systems Administrator",
          start: "Dec 2011",
          end: "Sep 2012",
          summary: "Citrix and Windows Server ops.",
        },
      ],
    },
    {
      org: "Earlier roles",
      location: "Illinois and Tennessee",
      roles: [
        {
          title: "Citrix consultant, systems engineer and administrator",
          start: "Mar 2005",
          end: "Dec 2011",
          summary:
            "Citrix and Windows engineering for healthcare, financial services and small-business clients: XenDesktop builds for remote call centers, 24×7 support for a 25-site medical practice, managed services for 50+ healthcare clients, and independent consulting.",
        },
      ],
    },
  ] satisfies Position[],
};
