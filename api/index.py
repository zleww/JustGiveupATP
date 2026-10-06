from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# ==========================================================
# 1. CONFIGURATION
# ==========================================================
API_KEY = "student-api-key-123"
API_VERSION = "1.0"

# ==========================================================
# 2. API KEY AUTHENTICATION DEPENDENCY
# ==========================================================
def verify_api_key(x_api_key: Optional[str] = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key."
        )
    return True

app = FastAPI(
    title="L-Lawliet API",
    description="An enterprise-style REST API providing simplified Philippine Republic Acts data.",
    version=API_VERSION
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# DATA MODELS
# ==========================================================
class CommentSubmission(BaseModel):
    user_name: str = Field(min_length=1, max_length=100)
    comment: str = Field(min_length=1, max_length=1000)

class Law(BaseModel):
    id: int = Field(gt=0, description="Unique primary identifier")
    ra_number: str = Field(min_length=3, max_length=20, description="e.g. RA 10175")
    official_title: str = Field(min_length=3, max_length=300)
    plain_title: str = Field(min_length=3, max_length=200)
    category: Literal[
    "Technology & Crime", 
    "Finance & Taxes", 
    "Governance & Business", 
    "Social & Welfare", 
    "Environment", 
    "Education & Civil Rights"
    ]
    year: int = Field(ge=1900, le=2100, description="Year enacted, after 1900")
    status: Literal["Active", "Amended", "Repealed"] = "Active"
    reading_time_minutes: int = Field(ge=1, le=120, description="Reading time in minutes")
    importance_rating: int = Field(ge=1, le=5, description="Impact score 1 to 5")
    tldr_summary: str = Field(min_length=10, max_length=500)
    full_breakdown: str = Field(min_length=10, max_length=2000)
    why_it_matters: str = Field(min_length=5, max_length=1000)
    example_scenario: str = Field(min_length=10, max_length=1000)
    penalties: str = Field(min_length=5, max_length=1000)
    min_fine_php: int = Field(ge=0, description="Minimum penalty fine in PHP")
    total_sections: int = Field(gt=0, le=1000, description="Section count in bill")
    enacting_president: str = Field(min_length=3, max_length=100)
    target_audience: str = Field(min_length=3, max_length=300)
    source_url: str = Field(min_length=10, max_length=500)
    user_notes: List[CommentSubmission] = Field(default_factory=list)

# ==========================================================
# 20 LAWS DATASET
# ==========================================================
LAWS_DATABASE = [
    {
        "id": 1,
        "ra_number": "RA 10175",
        "official_title": "Cybercrime Prevention Act of 2012",
        "plain_title": "Online Safety & Anti-Cybercrime Law",
        "category": "Technology & Crime",
        "year": 2012,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 5,
        "tldr_summary": "Protects people from online hacking, identity theft, cyber-bullying, and online libel.",
        "full_breakdown": "Covers illegal access to computers, online fraud, cybersex operations, child abuse online, and online defamation.",
        "why_it_matters": "Keeps your digital accounts, personal information, and reputation safe online.",
        "example_scenario": "If someone hacks your Facebook account or posts false malicious rumors about you online, they can be prosecuted under this law.",
        "penalties": "Fines from ₱200,000 to millions and 6 to 12+ years imprisonment depending on severity.",
        "min_fine_php": 200000,
        "total_sections": 31,
        "enacting_president": "Benigno Aquino III",
        "target_audience": "All internet and social media users, businesses, and website owners.",
        "source_url": "https://www.officialgazette.gov.ph/2012/09/12/republic-act-no-10175/",
        "user_notes": [{"user_name": "Juan D.", "comment": "Remember that online libel carries higher penalties than printed libel."}]
    },
    {
        "id": 2,
        "ra_number": "RA 10963",
        "official_title": "Tax Reform for Acceleration and Inclusion (TRAIN) Act",
        "plain_title": "Lower Income Tax & Excise Tax Rules",
        "category": "Finance & Taxes",
        "year": 2017,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 5,
        "tldr_summary": "Lowers personal income tax for most workers, but adds tax to sugary drinks, fuel, and cars.",
        "full_breakdown": "Individuals earning ₱250,000 or below annually pay 0% income tax. It restructured excise taxes across consumer goods.",
        "why_it_matters": "More take-home pay for standard wage earners, but slight price increases on sweetened drinks and transport.",
        "example_scenario": "If your annual salary is ₱240,000, no income tax is deducted from your monthly paycheck.",
        "penalties": "Standard Bureau of Internal Revenue (BIR) penalties, surcharges, and tax evasion charges.",
        "min_fine_php": 10000,
        "total_sections": 87,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "All employed workers, business owners, and consumers in the PH.",
        "source_url": "https://www.officialgazette.gov.ph/2017/12/19/republic-act-no-10963/",
        "user_notes": []
    },
    {
        "id": 3,
        "ra_number": "RA 11032",
        "official_title": "Ease of Doing Business and Efficient Government Service Delivery Act of 2018",
        "plain_title": "Anti-Red Tape & Faster Government Service Law",
        "category": "Governance & Business",
        "year": 2018,
        "status": "Active",
        "reading_time_minutes": 3,
        "importance_rating": 4,
        "tldr_summary": "Government offices must process simple transactions in 3 days, complex in 7 days, and highly technical in 20 days.",
        "full_breakdown": "Eliminates excessive bureaucracy, simplifies business permits, and penalizes government employees who delay processing unreasonably.",
        "why_it_matters": "Saves you time and cuts corruption when applying for government permits, clearances, and documents.",
        "example_scenario": "Applying for a simple barangay or city clearance shouldn't take weeks; agencies must release it within 3 working days.",
        "penalties": "6 months suspension for 1st offense; dismissal, fine up to ₱2,000,000, and jail time (1-6 years) for 2nd offense.",
        "min_fine_php": 500000,
        "total_sections": 23,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "Citizens dealing with government offices, business applicants.",
        "source_url": "https://www.officialgazette.gov.ph/2018/05/28/republic-act-no-11032/",
        "user_notes": []
    },
    {
        "id": 4,
        "ra_number": "RA 11313",
        "official_title": "Safe Spaces Act (Bawal Bastos Law)",
        "plain_title": "Anti-Catcalling & Gender-Based Harassment Law",
        "category": "Social & Welfare",
        "year": 2019,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 4,
        "tldr_summary": "Penalizes gender-based sexual harassment in streets, public spaces, online, workplaces, and educational institutions.",
        "full_breakdown": "Covers wolf-whistling, catcalling, unwanted physical touching, persistent uninvited remarks, and cyber-flashing online.",
        "why_it_matters": "Ensures public and digital spaces are safe, respectful, and free from verbal or physical harassment for everyone.",
        "example_scenario": "If someone makes unwanted lewd comments or unwelcome gestures toward you in public or online, it is punishable by law.",
        "penalties": "Community service, fines ranging from ₱10,000 to ₱500,000, and imprisonment depending on the gravity of the offense.",
        "min_fine_php": 10000,
        "total_sections": 28,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "All citizens, students, employees, public transport operators, and online users.",
        "source_url": "https://www.officialgazette.gov.ph/2019/04/17/republic-act-no-11313/",
        "user_notes": []
    },
    {
        "id": 5,
        "ra_number": "RA 9994",
        "official_title": "Expanded Senior Citizens Act of 2010",
        "plain_title": "Senior Citizens Benefits & 20% Discount Law",
        "category": "Social & Welfare",
        "year": 2010,
        "status": "Active",
        "reading_time_minutes": 3,
        "importance_rating": 4,
        "tldr_summary": "Grants senior citizens a 20% discount and VAT exemption on medicines, medical services, transport, and public utilities.",
        "full_breakdown": "Provides senior citizens privileges including monthly stipends for indigents, free medical/dental services, and prioritization in establishments.",
        "why_it_matters": "Provides financial relief and social protection for elderly Filipinos who have contributed to society.",
        "example_scenario": "When a senior citizen buys prescribed medicines or eats at a restaurant, they are entitled to a 20% discount plus VAT exemption upon presenting their Senior Citizen ID.",
        "penalties": "Fines from ₱50,000 to ₱200,000 and imprisonment for business owners who refuse to grant senior discounts.",
        "min_fine_php": 50000,
        "total_sections": 11,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "Senior citizens (aged 60 and above), families, and all commercial establishments.",
        "source_url": "https://www.officialgazette.gov.ph/2010/02/15/republic-act-no-9994/",
        "user_notes": []
    },
    {
        "id": 6,
        "ra_number": "RA 9165",
        "official_title": "Comprehensive Dangerous Drugs Act of 2002",
        "plain_title": "Anti-Illegal Drugs Law",
        "category": "Social & Welfare",
        "year": 2002,
        "status": "Active",
        "reading_time_minutes": 6,
        "importance_rating": 5,
        "tldr_summary": "Regulates and penalizes the importation, sale, possession, and use of dangerous drugs in the Philippines.",
        "full_breakdown": "Establishes rehabilitation frameworks alongside strict criminal penalties for drug trafficking and possession.",
        "why_it_matters": "Aims to safeguard citizens from the destruction of substance abuse while promoting medical rehab for first-time offenders.",
        "example_scenario": "Law enforcement must follow strict chain-of-custody rules during drug confiscation operations to ensure valid prosecution.",
        "penalties": "Life imprisonment to death (reimposed/adjusted under statutory rules) and massive fines.",
        "min_fine_php": 500000,
        "total_sections": 102,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "General public, law enforcement, medical institutions.",
        "source_url": "https://www.officialgazette.gov.ph/2002/06/07/republic-act-no-9165/",
        "user_notes": []
    },
    {
        "id": 7,
        "ra_number": "RA 10173",
        "official_title": "Data Privacy Act of 2012",
        "plain_title": "Data Privacy & Personal Information Protection Law",
        "category": "Technology & Crime",
        "year": 2012,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 5,
        "tldr_summary": "Protects individual personal information in information and communications systems in government and the private sector.",
        "full_breakdown": "Requires organizations to secure consent before collecting personal data and mandates strict data protection officer oversight.",
        "why_it_matters": "Stops companies from selling your private phone numbers, emails, and financial data without your clear permission.",
        "example_scenario": "If a lending app leaks your contacts list publicly to shame you into paying a loan, they violate this privacy act.",
        "penalties": "Imprisonment from 1 to 7 years and fines ranging from ₱500,000 to ₱5,000,000.",
        "min_fine_php": 500000,
        "total_sections": 45,
        "enacting_president": "Benigno Aquino III",
        "target_audience": "All businesses, corporations, app developers, and data subjects.",
        "source_url": "https://www.officialgazette.gov.ph/2012/08/15/republic-act-no-10173/",
        "user_notes": []
    },
    {
        "id": 8,
        "ra_number": "RA 10354",
        "official_title": "The Responsible Parenthood and Reproductive Health Act of 2012",
        "plain_title": "Reproductive Health & Family Planning Law",
        "category": "Social & Welfare",
        "year": 2012,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 4,
        "tldr_summary": "Guarantees universal access to methods on contraception, fertility control, sexual education, and maternal care.",
        "full_breakdown": "Mandates public healthcare centers to provide free reproductive health supplies and age-appropriate sex education in schools.",
        "why_it_matters": "Reduces maternal mortality rates and gives families the tools for planned parenthood.",
        "example_scenario": "Public hospitals must provide free family planning counseling and contraceptives to indigent mothers.",
        "penalties": "Fine and imprisonment for healthcare providers or officials who refuse to deliver mandated services.",
        "min_fine_php": 10000,
        "total_sections": 29,
        "enacting_president": "Benigno Aquino III",
        "target_audience": "Couples, women, medical practitioners, and educational institutions.",
        "source_url": "https://www.officialgazette.gov.ph/2012/12/21/republic-act-no-10354/",
        "user_notes": []
    },
    {
        "id": 9,
        "ra_number": "RA 8293",
        "official_title": "Intellectual Property Code of the Philippines",
        "plain_title": "Copyright, Trademark & Patent Protection Law",
        "category": "Governance & Business",
        "year": 1997,
        "status": "Active",
        "reading_time_minutes": 6,
        "importance_rating": 4,
        "tldr_summary": "Protects creators, inventors, and businesses by securing exclusive rights over their artistic works, inventions, and brand names.",
        "full_breakdown": "Prohibits unauthorized reproduction, distribution, and commercial sale of copyrighted intellectual property.",
        "why_it_matters": "Encourages innovation and artistic creation by ensuring inventors and creators profit from their original hard work.",
        "example_scenario": "Selling bootleg copies of a newly released local movie online or copying a patented brand design constitutes copyright infringement.",
        "penalties": "Fines from ₱50,000 to ₱500,000 and imprisonment up to 6 years for infringement.",
        "min_fine_php": 50000,
        "total_sections": 240,
        "enacting_president": "Fidel V. Ramos",
        "target_audience": "Artists, inventors, entrepreneurs, digital content creators, and businesses.",
        "source_url": "https://www.officialgazette.gov.ph/1997/06/06/republic-act-no-8293/",
        "user_notes": []
    },
    {
        "id": 10,
        "ra_number": "RA 9262",
        "official_title": "Anti-Violence Against Women and Their Children Act of 2004",
        "plain_title": "Protection Against Domestic & Psychological Abuse Law",
        "category": "Social & Welfare",
        "year": 2004,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 5,
        "tldr_summary": "Protects women and children from physical, sexual, psychological violence, and economic abuse by intimate partners.",
        "full_breakdown": "Allows victims to secure Barangay Protection Orders (BPO) or Temporary Protection Orders (TPO) instantly from courts.",
        "why_it_matters": "Provides robust legal shields against domestic tyrants, financial deprivation, and emotional battery within households.",
        "example_scenario": "If a husband deliberately withholds financial support for household needs to mentally torture his wife and children, it is penalized under this act.",
        "penalties": "Prision mayor to reclusion perpetua and mandatory psychological counseling.",
        "min_fine_php": 100000,
        "total_sections": 47,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "Women, children, law enforcement, and local barangay officials.",
        "source_url": "https://www.officialgazette.gov.ph/2004/03/08/republic-act-no-9262/",
        "user_notes": []
    },
    {
        "id": 11,
        "ra_number": "RA 9501",
        "official_title": "Magna Carta for Micro, Small and Medium Enterprises (MSMEs)",
        "plain_title": "MSME Development & Support Law",
        "category": "Governance & Business",
        "year": 2008,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 4,
        "tldr_summary": "Promotes, develops, and assists small and medium enterprises by mandating bank financing allocations and government support.",
        "full_breakdown": "Requires lending institutions to set aside a specific percentage of their loan portfolio for small business development.",
        "why_it_matters": "Empowers local entrepreneurs and small business owners to secure capital and grow the national economy.",
        "example_scenario": "A local coffee shop owner can apply for specialized bank credit programs backed by state business development agencies.",
        "penalties": "Penalties imposed on banking institutions failing to meet mandatory micro-lending allocations.",
        "min_fine_php": 500000,
        "total_sections": 22,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "Entrepreneurs, startup owners, banks, and commercial agencies.",
        "source_url": "https://www.officialgazette.gov.ph/2008/05/23/republic-act-no-9501/",
        "user_notes": []
    },
    {
        "id": 12,
        "ra_number": "RA 10627",
        "official_title": "Anti-Bullying Act of 2013",
        "plain_title": "School Anti-Bullying Policy Law",
        "category": "Education & Civil Rights",
        "year": 2013,
        "status": "Active",
        "reading_time_minutes": 3,
        "importance_rating": 4,
        "tldr_summary": "Requires all elementary and secondary schools to adopt policies explicitly addressing and punishing bullying on campus.",
        "full_breakdown": "Mandates disciplinary actions for physical, cyber, social, and verbal harassment within school environments.",
        "why_it_matters": "Keeps students safe from psychological trauma and creates safe, disciplined academic environments.",
        "example_scenario": "If a student continually mocks and harasses a classmate online or in hallways, the school administration must intervene under strict anti-bullying protocols.",
        "penalties": "Administrative sanctions for school administrators who fail to implement anti-bullying policies.",
        "min_fine_php": 0,
        "total_sections": 10,
        "enacting_president": "Benigno Aquino III",
        "target_audience": "Students, teachers, school principals, and parents.",
        "source_url": "https://www.officialgazette.gov.ph/2013/09/12/republic-act-no-10627/",
        "user_notes": []
    },
    {
        "id": 13,
        "ra_number": "RA 9003",
        "official_title": "Ecological Solid Waste Management Act of 2000",
        "plain_title": "National Garbage Segregation & Recycling Law",
        "category": "Environment",
        "year": 2001,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 4,
        "tldr_summary": "Mandates systematic, ecological solid waste management program across local government units (LGUs).",
        "full_breakdown": "Requires household garbage segregation (biodegradable, non-biodegradable, recyclable, hazardous) at source.",
        "why_it_matters": "Protects the environment, reduces trash overflow, and promotes community recycling initiatives.",
        "example_scenario": "Garbage collectors can refuse to pick up residential trash bags if plastics and food wastes are mixed together without sorting.",
        "penalties": "Fines from ₱300 to ₱1,000 or community service for individual violators; heavier corporate penalties.",
        "min_fine_php": 300,
        "total_sections": 66,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "All households, local government units, commercial businesses.",
        "source_url": "https://www.officialgazette.gov.ph/2001/01/26/republic-act-no-9003/",
        "user_notes": []
    },
    {
        "id": 14,
        "ra_number": "RA 8749",
        "official_title": "Philippine Clean Air Act of 1999",
        "plain_title": "National Air Quality & Anti-Smoke Belching Law",
        "category": "Environment",
        "year": 1999,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 4,
        "tldr_summary": "Outlines a comprehensive air pollution control policy focusing on motor vehicle emissions and industrial pollutants.",
        "full_breakdown": "Bans dangerous emission levels, prohibits open burning of municipal waste, and regulates factory air emissions.",
        "why_it_matters": "Ensures cleaner air quality in urban centers, reducing respiratory illnesses across communities.",
        "example_scenario": "A public utility vehicle emitting thick black smoke can be flagged, fined, and ordered for inspection.",
        "penalties": "Fines and vehicle registration suspension for smoke-belching operators.",
        "min_fine_php": 1000,
        "total_sections": 56,
        "enacting_president": "Joseph Estrada",
        "target_audience": "Motorists, factory owners, local transport authorities.",
        "source_url": "https://www.officialgazette.gov.ph/1999/06/23/republic-act-no-8749/",
        "user_notes": []
    },
    {
        "id": 15,
        "ra_number": "RA 9275",
        "official_title": "Philippine Clean Water Act of 2004",
        "plain_title": "National Water Quality & Sewage Management Law",
        "category": "Environment",
        "year": 2004,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 4,
        "tldr_summary": "Aims to protect, preserve, and revitalize the quality of Philippine water bodies from land-based pollution sources.",
        "full_breakdown": "Requires commercial establishments and factories to treat wastewater before discharging into drainage systems.",
        "why_it_matters": "Prevents toxic contamination of rivers, lakes, and coastal beaches used by communities.",
        "example_scenario": "A factory dumping untreated chemical waste straight into a local river will face severe environmental closure orders.",
        "penalties": "Fines ranging from ₱10,000 to ₱200,000 per day of violation until compliance is met.",
        "min_fine_php": 10000,
        "total_sections": 34,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "Industrial factories, real estate developers, local government water districts.",
        "source_url": "https://www.officialgazette.gov.ph/2004/03/22/republic-act-no-9275/",
        "user_notes": []
    },
    {
        "id": 16,
        "ra_number": "RA 11223",
        "official_title": "Universal Health Care Act",
        "plain_title": "Universal PhilHealth Coverage Law",
        "category": "Social & Welfare",
        "year": 2019,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 5,
        "tldr_summary": "Automatically enrolls all Filipino citizens into the National Health Insurance Program (PhilHealth).",
        "full_breakdown": "Expands healthcare accessibility, promising equitable access to quality and affordable health goods and services.",
        "why_it_matters": "Ensures every Filipino has baseline medical insurance coverage during hospital emergencies.",
        "example_scenario": "Any Filipino citizen can walk into a public government hospital and claim subsidized or free medical inpatient care benefits.",
        "penalties": "Penalties for employers failing to remit correct PhilHealth contributions for workers.",
        "min_fine_php": 5000,
        "total_sections": 44,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "All Filipino citizens, hospitals, healthcare professionals.",
        "source_url": "https://www.officialgazette.gov.ph/2019/02/20/republic-act-no-11223/",
        "user_notes": []
    },
    {
        "id": 17,
        "ra_number": "RA 10931",
        "official_title": "Universal Access to Quality Tertiary Education Act",
        "plain_title": "Free Tuition in State Universities Act",
        "category": "Education & Civil Rights",
        "year": 2017,
        "status": "Active",
        "reading_time_minutes": 3,
        "importance_rating": 5,
        "tldr_summary": "Provides free tuition and miscellaneous fees to students enrolled in state universities and colleges (SUCs).",
        "full_breakdown": "Eliminates tuition expenses in public colleges and institutes while providing expanded tertiary education subsidy options.",
        "why_it_matters": "Opens higher education doors to underprivileged students who otherwise couldn't afford college tuition.",
        "example_scenario": "An incoming college student admitted into a state university doesn't have to pay tuition fees for their undergraduate degree course.",
        "penalties": "Administrative sanctions for institutions charging illegal auxiliary fees on covered programs.",
        "min_fine_php": 0,
        "total_sections": 17,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "College students, parents, state universities, and local colleges.",
        "source_url": "https://www.officialgazette.gov.ph/2017/08/03/republic-act-no-10931/",
        "user_notes": []
    },
    {
        "id": 18,
        "ra_number": "RA 7394",
        "official_title": "Consumer Act of the Philippines",
        "plain_title": "Consumer Rights & Product Safety Protection Law",
        "category": "Governance & Business",
        "year": 1992,
        "status": "Active",
        "reading_time_minutes": 5,
        "importance_rating": 4,
        "tldr_summary": "Protects consumer interests, promotes general welfare, and establishes standards of conduct for business and industry.",
        "full_breakdown": "Guarantees protection against deceptive, unfair, and unconscionable sales acts and defective product hazards.",
        "why_it_matters": "Gives buyers the legal right to seek refunds, replacements, or damages for defective products or deceptive marketing.",
        "example_scenario": "If a mall sells expired canned goods or unsafe appliances that break immediately, consumers can report them to the DTI under this act.",
        "penalties": "Fines and imprisonment for merchants distributing hazardous or deceptively labeled items.",
        "min_fine_php": 500,
        "total_sections": 173,
        "enacting_president": "Corazon Aquino",
        "target_audience": "All consumers, retail businesses, manufacturers, and trade departments.",
        "source_url": "https://www.officialgazette.gov.ph/1992/04/13/republic-act-no-7394/",
        "user_notes": []
    },
    {
        "id": 19,
        "ra_number": "RA 9485",
        "official_title": "Anti-Red Tape Act of 2007",
        "plain_title": "Anti-Red Tape & Swift Public Service Act",
        "category": "Governance & Business",
        "year": 2007,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 4,
        "tldr_summary": "Promotes integrity, accountability, and proper performance of officials by cutting bureaucratic red tape in government.",
        "full_breakdown": "Requires public offices to display clear transaction charters and process frontline documents within strict timeframes.",
        "why_it_matters": "Minimizes bureaucratic bottlenecks and eliminates corrupt fixers in government agencies.",
        "example_scenario": "Government windows must process public transactions transparently without demanding under-the-table facilitation fees.",
        "penalties": "Suspension and dismissal from public service for erring government employees.",
        "min_fine_php": 10000,
        "total_sections": 17,
        "enacting_president": "Gloria Macapagal Arroyo",
        "target_audience": "Government workers, citizens transacting with public offices.",
        "source_url": "https://www.officialgazette.gov.ph/2007/06/02/republic-act-no-9485/",
        "user_notes": []
    },
    {
        "id": 20,
        "ra_number": "RA 11469",
        "official_title": "Bayanihan to Heal as One Act",
        "plain_title": "Bayanihan Emergency Powers Act",
        "category": "Governance & Business",
        "year": 2020,
        "status": "Repealed",
        "reading_time_minutes": 4,
        "importance_rating": 4,
        "tldr_summary": "Grants temporary emergency powers to the President to address national health crises like the COVID-19 pandemic.",
        "full_breakdown": "Authorizes budget reallocation, temporary takeover of enterprises for public health necessities, and social amelioration distributions.",
        "why_it_matters": "Allows swift governmental mobilization of funds and resources during unprecedented public emergencies.",
        "example_scenario": "The government is empowered to distribute emergency cash subsidies swiftly to impacted low-income families during lockdowns.",
        "penalties": "Imprisonment and heavy fines for individuals or entities hoarding medical supplies or spreading fake pandemic panic.",
        "min_fine_php": 10000,
        "total_sections": 10,
        "enacting_president": "Rodrigo Duterte",
        "target_audience": "National government agencies, local government units, all citizens.",
        "source_url": "https://www.officialgazette.gov.ph/2020/03/24/republic-act-no-11469/",
        "user_notes": []
    },
    {
        "id": 24,
        "ra_number": "RA 8353",
        "official_title": "The Anti-Rape Law of 1997",
        "plain_title": "Expanded Anti-Rape Law",
        "category": "Social & Welfare",
        "year": 1997,
        "status": "Active",
        "reading_time_minutes": 4,
        "importance_rating": 5,
        "tldr_summary": "Reclassifies rape from a crime against chastity to a crime against persons, expanding its legal definition and statutory coverage.",
        "full_breakdown": "Broadens the legal definition of rape to include various forms of sexual penetration using objects or body parts, and eliminates traditional marriage exceptions.",
        "why_it_matters": "Strengthens victim protections by recognizing that sexual assault is an offense against an individual's personal bodily autonomy.",
        "example_scenario": "Perpetrators of non-consensual sexual assault face strict penal prosecution under crimes against persons regardless of marital or social relations.",
        "penalties": "Reclusion perpetua to death (currently life imprisonment under the suspension of the death penalty).",
        "min_fine_php": 50000,
        "total_sections": 14,
        "enacting_president": "Fidel V. Ramos",
        "target_audience": "Law enforcement, judiciary, general public.",
        "source_url": "https://www.officialgazette.gov.ph/1997/09/30/republic-act-no-8353/",
        "user_notes": []
    }
]

# ==========================================================
# VALIDATE STARTING DATASET ON LAUNCH
# ==========================================================
validated_laws = [Law(**law).model_dump() for law in LAWS_DATABASE]
LAWS_DATABASE = validated_laws

# ==========================================================
# ENDPOINTS
# ==========================================================


# ==========================================================
# HEALTH CHECK (Public)
# ==========================================================
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "L-Lawliet API",
        "version": API_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==========================================================
# SEARCH LAWS (Protected)
# ==========================================================
@app.get("/api/v1/laws/search", dependencies=[Depends(verify_api_key)])
@app.get("/api/laws/search", dependencies=[Depends(verify_api_key)])
def search_laws(q: str = Query(..., min_length=1, description="Search query string")):
    q_lower = q.lower()
    results = []

    for law in LAWS_DATABASE:
        searchable_text = (
            f"{law['ra_number']} "
            f"{law['official_title']} "
            f"{law['plain_title']} "
            f"{law['category']} "
            f"{law['year']} "
            f"{law['status']} "
            f"{law['enacting_president']} "
            f"{law['target_audience']} "
            f"{law['tldr_summary']} "
            f"{law['full_breakdown']} "
            f"{law['why_it_matters']} "
            f"{law['example_scenario']} "
            f"{law['penalties']}"
        ).lower()

        if q_lower in searchable_text:
            results.append(law)

    return {
        "query": q,
        "count": len(results),
        "results": results
    }

# ==========================================================
# GET ALL LAWS (Protected)
# ==========================================================
@app.get("/api/v1/laws", dependencies=[Depends(verify_api_key)])
@app.get("/api/laws", dependencies=[Depends(verify_api_key)])
def get_laws(search: Optional[str] = None):
    """Fetch laws with optional keyword filtering (Protected)"""
    if not search:
        return {
            "count": len(LAWS_DATABASE),
            "laws": LAWS_DATABASE
        }
    
    query = search.lower()
    filtered = [
        law for law in LAWS_DATABASE
        if query in law["ra_number"].lower()
        or query in law["plain_title"].lower()
        or query in law["category"].lower()
        or query in law["tldr_summary"].lower()
    ]
    return {
        "count": len(filtered),
        "laws": filtered
    }

# ==========================================================
# GET ONE LAW (Protected)
# ==========================================================
@app.get("/api/v1/laws/{law_id}", dependencies=[Depends(verify_api_key)])
@app.get("/api/laws/{law_id}", dependencies=[Depends(verify_api_key)])
def get_law(law_id: int):
    """Fetch single law detail (Protected)"""
    for law in LAWS_DATABASE:
        if law["id"] == law_id:
            return law
    raise HTTPException(status_code=404, detail="Law not found.")

# ==========================================================
# ADD COMMENT (Protected)
# ==========================================================
@app.post("/api/v1/laws/{law_id}/comments", dependencies=[Depends(verify_api_key)])
def add_user_comment(law_id: int, payload: CommentSubmission):
    """Add a user tip or comment (Protected)"""
    for law in LAWS_DATABASE:
        if law["id"] == law_id:
            new_comment = {"user_name": payload.user_name, "comment": payload.comment}
            law["user_notes"].append(new_comment)
            return {"message": "Knowledge added successfully!", "comments": law["user_notes"]}
            
    raise HTTPException(status_code=404, detail="Law not found.")