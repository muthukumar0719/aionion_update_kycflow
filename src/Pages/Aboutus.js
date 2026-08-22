import { useNavigate, useLocation } from "react-router-dom";

import { useEffect } from "react";

import aboutus from "../assets/aboutus.png";
import wright from "../assets/wright.png";

import Transparency from "../assets/Transparency.png";
import Empowering from "../assets/Empowering.png";
import World from "../assets/World.png";

import phone from "../assets/phone.png";
import email from "../assets/email.png";

import openaccount from "../assets/openaccount.png";

const Data = [
  {
    img: Transparency,
    title: "Transparency",
    desc: "We ensure open and clear communication at every step. Integrity: Upholding the highest standards of trust and ethics. Accessibility: Breaking barriers to make financial markets available to all. Excellence: Continuously innovating to deliver the best stockbroking experiences",
  },
  {
    img: Empowering,
    title: "Empowering Investors, Enabling Access",
    desc: "Our mission is to foster a community of informed investors by equipping them with the tools, knowledge, and access necessary to navigate financial markets with confidence and make decisions aligned with their long-term goal.",
  },
  {
    img: World,
    title: "A world of accessible opportunities",
    desc: "We envision a future where everyone, regardless of their background, has the ability to participate in financial markets, leveraging knowledge and access to achieve their investment aspirations.",
  },
];

const Person = [
  {
    title: "Additional Director",
    name: "Srinivasan Anand",
    number: "044-46895225",
    mail: "anandsrinivasan@aionioncapital.com",
  },
  {
    title: "Director",
    name: "Anish Gupta",
    number: "044-46895225",
    mail: "anish@aionioncapital.com",
  },
  {
    title: "Director",
    name: "Dileep Keerthi Kumar",
    number: "044-46895225",
    mail: "dileep.k@aionioncapital.com",
  },
  {
    title: "Director",
    name: "Gnanasundaram Vinodhkumar",
    number: "044-46895225",
    mail: "vinodhkumar.g@aionioncapital.com",
  },
  {
    title: "Director",
    name: "Ariyapadi Srinivasan Rajasekaran",
    number: "044-46895225",
    mail: "rajasekaran.s@aionioncapital.com",
  },
  {
    title: "Compliance Officer",
    name: "Swati Keshari",
    number: "044-46895225",
    mail: "swati.k@aionioncapital.com",
  },
];

const teambranch = [
  {
    city: "HEAD OFFICE",
    address: [
      "Reg. Office: 3rd Floor, Meerlan Towers,",
      "No. 33 Hanumantha Road, Royapettah,",
      "Chennai - 600 014",
      "Ph: 044-46895225",
    ],
  },
  {
    city: "COIMBATORE",
    address: [
      "Grand CAG Central, 3rd Floor , NAVA INDIA, 110, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641037",
    ],
  },
  {
    city: "TRICHY",
    address: [
      "ANSHIL ARCADE, 2nd Floor,",
      "Old No.11, New No.39 (Plot No.660),",
      "EVR Salai, K.K.Nagar,",
      "Tiruchirappalli - 620 021",
    ],
  },
  {
    city: "MADURAI",
    address: [
      "70, Navalar Nagar 3rd St, Sakthi Velammal Nagar, S S Colony, Madurai, Tamil Nadu 625016",
    ],
  },
  {
    city: "BANGALORE",
    address: [
      "2062, 1st Floor,",
      "23rd Main Rd, Vanganahalli,",
      "1st Sector, HSR Layout,",
      "Bengaluru, Karnataka 560102",
    ],
  },
  {
    city: "NAMAKKAL",
    address: [
      "Door No: 341/113A1, 1st Floor S.P. Pudur Main Road, Paramathi Rd, Namakkal, Tamil Nadu 637001",
    ],
  },
];

const Aboutus = () => {
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.replace("#", ""));

      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div>
      <div className='container'>
        <h2 className='text-center aboutus-header'>About Us</h2>

        <div className='row aboutus-content'>
          <div className='col-lg-6'>
            <img src={aboutus} alt='smart' className='Aboutusimg' />
          </div>

          <div className='col-lg-6 aboutus-right'>
            <div className='aboutus-right-start'>
              <h3>Why you Need Aionion Capital</h3>
              <h6>Your Trusted Partner in Financial Growth</h6>
            </div>

            <div className='about-mobile'>
              <div className='about-item'>
                <img src={wright} alt='Transparency' />
                <p>Transparency </p>
              </div>

              <div className='about-item'>
                <img src={wright} alt='Empowering Investors' />
                <p>Empowering Investors </p>
              </div>

              <div className='about-item'>
                <img src={wright} alt='Accessible Opportunities' />
                <p>Accessible Investment </p>
              </div>
            </div>

            <div>
              <p>
                <strong>
                  Aionion Capital Market Services Private Limited
                </strong>{" "}
                is a new-age stockbroking company, here to simplify your
                investment journey. With a steadfast commitment to empowering
                investors, we focus on creating informed investment communities
                and facilitating seamless access to financial markets.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='aboutus-approach'>
        <div className='container'>
          <h2 className='text-center'>Our Approach</h2>

          <div className='row'>
            {Data.map((item) => (
              <div className='col-lg-4 approach-card' key={item.title}>
                <div className='Aboutus-card text-center'>
                  <div className=''>
                    <img src={item.img} alt={item.title} className='Cardimg' />
                    <h3 class="tx">{item.title}</h3>
                  </div>

                  <p className='approach-text'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='container'>
        <h2 className='text-center people-header' id='meet-the-people'>
          Details of Key Managerial Personnel (KMPs) Including Compliance
          Officer
        </h2>
        <p className='people-subtitle text-center'>
          Detailed list of individuals authorized to act on behalf of Aionion
          Capital Market Services Private Limited, including their contact
          details.
        </p>

        <div className='row mb-4'>
          {Person.map((item, index) => (
            <div className='col-lg-4 mb-4' key={index}>
              <div className='contact-card-detail'>
                <div className='contact-card-style'>
                  <h4>{item.title}</h4>
                </div>

                <div className='contact-person'>
                  <h3>{item.name}</h3>

                  <div className='d-flex Contact-card-content'>
                    <img src={phone} alt='phone' className='contactimg' />
                    <p>{item.number}</p>
                  </div>

                  <div className='d-flex Contact-card-content'>
                    <img src={email} alt='email' className='contactimg' />
                    <p>{item.mail}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='basic-details'>
        <h2 className='basic-title'>Basic Details</h2>
        <div className='container'>
          <div className='basic-wrapper '>
            <div className='basic-card'>
              <div className='basic-grid'>
                <div>
                  <p className='label'>Name</p>
                  <p className='value'>
                    M/s AIONION CAPITAL MARKET SERVICES PRIVATE LIMITED
                  </p>
                </div>

                <div>
                  <p className='label'>Address</p>
                  <p className='value'>
                    3rd Floor, Meerlan Towers, No.33, Hanumantha Road,
                    Royapettah, Chennai - 600 014
                  </p>
                </div>

                <div>
                  <p className='label'>Company PAN</p>
                  <p className='value'>ABACA2285K</p>
                </div>

                <div>
                  <p className='label'>Stock Broker SEBI Registration Number</p>
                  <p className='value'>INZ000318532</p>
                </div>

                <div>
                  <p className='label'>GST Registration Number</p>
                  <p className='value'>33ABACA2285K1ZR</p>
                </div>

                <div>
                  <p className='label'>CIN</p>
                  <p className='value'>U66120TN2024PTC167864</p>
                </div>

                <div>
                  <p className='label'>TAN</p>
                  <p className='value'>CHEA37281G</p>
                </div>

                <div>
                  <p className='label'>BSE Member Code</p>
                  <p className='value'>6878</p>
                </div>

                <div>
                  <p className='label'>NSE Member Code</p>
                  <p className='value'>90405</p>
                </div>

                <div>
                  <p className='label'>AMFI Registration Number</p>
                  <p className='value'>ARN-296313</p>
                </div>

                <div>
                  <p className='label'>Mail id</p>
                  <p className='value'>compliance@aionioncapital.com</p>
                </div>

                <div>
                  <p className='label'>CDSL DPID</p>
                  <p className='value'>12100800</p>
                </div>

                <div>
                  <p className='label'>NSDL DPID</p>
                  <p className='value'>IN304772</p>
                </div>

                <div>
                  <p className='label'>
                    Research Analyst SEBI Registration Number
                  </p>
                  <p className='value'>INH000020138</p>
                </div>

                <div>
                  <p className='label'>
                    SEBI DP Registration no
                  </p>
                  <p className='value'>IN-DP-790-2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='about-Section'>
        <div className='container'>
          <h2 className='text-center branch-heading'>Our Branch Address</h2>

          <div className='row'>
            {teambranch.map((branch, index) => (
              <div className='col-lg-4 col-md-6 mb-4' key={index}>
                <div className='About-card h-100'>
                  <h4>{branch.city}</h4>

                  <div className='address-text'>
                    {branch.address.map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='Get-started'>
        <div className='container'>
          <div className='row demartacc-card'>
            <div className='col-lg-6 demartacc-left'>
              <h4>GET STARTED WITH</h4>
              <h3>Demat account</h3>
              <p>
                Our platform offers a robust suite of investor-focused features,
                helping you make data-driven decisions effortlessly.
              </p>
              <button
                type='button'
                className='hero-Accountbtn'
                onClick={() => {
                  navigate("/openaccount");
                }}
              >
                Open Demat Account
              </button>
            </div>

            <div className='col-lg-6'>
              <img
                src={openaccount}
                alt='demataccount'
                className='demataccountimg'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aboutus;
