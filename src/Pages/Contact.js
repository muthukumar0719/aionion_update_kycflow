import React, { useState } from "react";
import { toast } from "react-toastify";

import phone from "../assets/phone.png";
import email from "../assets/email.png";
import Location from "../assets/Location.png";
import time from "../assets/time.png";

import otp from "../assets/otp.png";
import api from "../services/api";

const contactData = [
  {
    tag: "1. Reach Out Client Care",
    title: "Client Care Department",
    phone: "(+91) 92402 62108",
    email: "clientcare@aionioncapital.com",
    address:
      "3rd Floor, Meerlan Towers, No. 33 Hanumantha Road, Royapettah, Chennai - 600014",
    timing: "Mon-Fri (9 AM to 6 PM, IST)",
  },
  {
    tag: "2. Reach Out Grievance Redressal Officer",
    title: "Ms Swati Keshari",
    phone: "(+91) 7305088516",
    email: "grievances@aionioncapital.com",
    address:
      "3rd Floor, Meerlan Towers, No. 33 Hanumantha Road, Royapettah, Chennai - 600014",
    timing: "Mon-Fri (9 AM to 6 PM, IST)",
  },
  {
    tag: "3. Reach Out Head of Operations",
    title: "Mr Kumar Mahlingam Iyer",
    phone: "(+91) 8925808627",
    email: "kumarmahlingam.iyer@aionioncapital.com",
    address:
      "3rd Floor, Meerlan Towers, No. 33 Hanumantha Road, Royapettah, Chennai - 600014",
    timing: "Mon-Fri (9 AM to 6 PM, IST)",
  },
  {
    tag: "4. Reach Out Director",
    title: " Mr Anish Gupta",
    phone: "(+91) 8925808630",
    email: "compliance@aionioncapital.com",
    address:
      "3rd Floor, Meerlan Towers, No. 33 Hanumantha Road, Royapettah, Chennai - 600014",
    timing: "Mon-Fri (9 AM to 6 PM, IST)",
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

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone_number" ? value.replace(/[^\d+\-\s()]/g, "") : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.first_name.trim()) {
      nextErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      nextErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone_number.trim()) {
      nextErrors.phone_number = "Phone number is required";
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(formData.phone_number.trim())) {
      nextErrors.phone_number = "Please enter a valid phone number";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Message is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim(),
        message: formData.message.trim(),
      };

      const response = await api.post("/contact/enquiries", payload);
      const responseMessage =
        response?.data?.message || "Your enquiry has been submitted successfully";

      toast.success(responseMessage);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        message: "",
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to submit your enquiry right now";

      setErrors({
        general: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='container'>
        <h2 className='text-center'>Contact Us</h2>
        <h3 className='text-center contact-heading'>
          Any question or remarks? Just write us a message!
        </h3>

        <div className='row contact-card'>
          <div className='col-lg-4 contact-card-left'>
            <h3>Contact Information</h3>
            <p>Say something to start a live chat!</p>
            <div className='d-flex Contact-card-content'>
              <img src={phone} alt='phone' className='contactimg' />
              <p>(+91) 92402 62108</p>
            </div>
            <div className='d-flex Contact-card-content'>
              <img src={email} alt='phone' className='contactimg' />
              <p>clientcare@aionioncapital.com</p>
            </div>
            <div className='d-flex Contact-card-content'>
              <img src={Location} alt='phone' className='contactimg' />
              <p className='address'>
                {`3rd Floor, Meerlan Towers,
                No. 33 Hanumantha Road, Royapettah,
                Chennai - 600 014
                Ph: 044-46895225`}
              </p>
            </div>
          </div>

          <div className='col-lg-8 contact-card-right'>
            <div className='contact-container'>
              <form className='contact-form' onSubmit={handleSubmit}>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>First Name</label>
                    <input
                      type='text'
                      name='first_name'
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                    {errors.first_name && (
                      <p className='error-text'>{errors.first_name}</p>
                    )}
                  </div>

                  <div className='form-group'>
                    <label>Last Name</label>
                    <input
                      type='text'
                      name='last_name'
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                    {errors.last_name && (
                      <p className='error-text'>{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className='form-row'>
                  <div className='form-group'>
                    <label>Email</label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <p className='error-text'>{errors.email}</p>}
                  </div>

                  <div className='form-group'>
                    <label>Phone Number</label>
                    <input
                      type='tel'
                      name='phone_number'
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                    {errors.phone_number && (
                      <p className='error-text'>{errors.phone_number}</p>
                    )}
                  </div>
                </div>

                <div className='form-group full-width'>
                  <label>Message</label>
                  <textarea
                    name='message'
                    placeholder='Write your message..'
                    value={formData.message}
                    onChange={handleChange}
                  />
                  {errors.message && <p className='error-text'>{errors.message}</p>}
                </div>

                {errors.general && <p className='error-text'>{errors.general}</p>}

                <div className='btn-wrapper'>
                  <button
                    type='submit'
                    className='send-message-btn'
                    disabled={loading}
                  >
                    <img src={otp} alt='Send' className='send-icon' />
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className='contact-details'>
        <div className='container'>
          <h2 className='text-center'>Escalation Matrix</h2>
          <h3 className='text-center'>Details of Contact Persons</h3>

          <div className='row contact-row'>
            {contactData.map((item, index) => (
              <div className='col-lg-6 mb-4' key={index}>
                <div className='contact-card-detail'>
                  <div>
                    <h4 className='contact-card-detail-content'>{item.tag}</h4>
                  </div>
                  <div className='contact-person'>
                    <h3>{item.title}</h3>

                    <div className='d-flex Contact-card-content'>
                      <img src={phone} alt='phone' className='contactimg' />
                      <p>{item.phone}</p>
                    </div>

                    <div className='d-flex Contact-card-content'>
                      <img src={email} alt='email' className='contactimg' />
                      <p>{item.email}</p>
                    </div>

                    <div className='d-flex Contact-card-content'>
                      <img
                        src={Location}
                        alt='location'
                        className='contactimg'
                      />
                      <p>{item.address}</p>
                    </div>

                    <div className='d-flex Contact-card-content'>
                      <img src={time} alt='time' className='contactimg' />
                      <p>{item.timing}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='about-Section'>
        <div className='container mt-5'>
          <h3 className='mb-4 text-center branch-heading'>
            Our Branch Address
          </h3>

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
    </div>
  );
};

export default Contact;
