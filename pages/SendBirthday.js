//// UPDATED CODE FOR CONSTANT MENTOR

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import axios from "axios";
import "../pages/frontend.css";
import Layout from "../component/Layout";
import "../src/app/styles/main.scss";

const BirthdayPage = () => {
  const [users, setUsers] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);

  const getFormattedDate = (offset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const today = getFormattedDate(0);
  const tomorrow = getFormattedDate(1);

  const fetchBirthdayUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "birthdaycanvas"));
    const birthdayUsers = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dobRaw = data.dob;

      if (dobRaw) {
        const dobDate = new Date(dobRaw);
        const formattedDOB = `${String(dobDate.getDate()).padStart(
          2,
          "0"
        )}/${String(dobDate.getMonth() + 1).padStart(2, "0")}`;

        if (formattedDOB === today || formattedDOB === tomorrow) {
          birthdayUsers.push({ id: doc.id, ...data });
        }
      }
    });

    setUsers(birthdayUsers);
  };

  const sanitizeText = (text) =>
    text.replace(/\s{5,}/g, " ").replace(/[\n\r\t]+/g, " ").trim();

  const sendWhatsAppMessage = async (user) => {
    const templateName = "daily_reminder";
    let phoneNumber = user["phone"];
    const name = user["name"];
    const imageUrl = user.imageUrl;

    const accessToken = "EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD";
    const phoneNumberId = "527476310441806";

    if (!phoneNumber) {
      alert("Phone number missing");
      return;
    }

    phoneNumber = phoneNumber.replace(/^\+/, "");

    if (!/^\d{10,15}$/.test(phoneNumber)) {
      alert("Invalid phone format");
      return;
    }

    const birthdayMessage = sanitizeText(
      `Today Be Special, Connect with Love and Grow in Abundance.

UJustBe Universe wishes you a day full of happiness and a year that brings you much success.
May all life's blessings be yours, on your birthday and always.

Happy Birthday!!!🥳🎂🎊🎊🎂🎉`
    );

    try {
      // 🎂 Send birthday message to employee
      await axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: { link: imageUrl },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: name },
                  { type: "text", text: birthdayMessage },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      //// === CONSTANT MENTOR / SUPPORT TEAM MESSAGE ===
      const mentorName = "HR Team";
      const mentorPhone = "8928660399";
      const mentorMessage = `Today is our employee's (${name}) birthday, kindly send your wishes.`;

      // 🎁 Send message to Support Team
      await axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: mentorPhone,
          type: "template",
          template: {
            name: "daily_reminder",
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: { link: imageUrl },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: mentorName },
                  { type: "text", text: mentorMessage },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSentMessages((prev) => [...prev, user.id]);

      alert(`WhatsApp message sent to ${name} and HR Team`);
    } catch (error) {
      console.error("Message send error:", error.response?.data || error);
      alert("Failed to send message");
    }
  };

  useEffect(() => {
    fetchBirthdayUsers();
  }, []);

  const todayBirthdays = users.filter((user) => {
    const dobDate = new Date(user.dob);
    return (
      `${String(dobDate.getDate()).padStart(2, "0")}/${String(
        dobDate.getMonth() + 1
      ).padStart(2, "0")}` === today
    );
  });

  const tomorrowBirthdays = users.filter((user) => {
    const dobDate = new Date(user.dob);
    return (
      `${String(dobDate.getDate()).padStart(2, "0")}/${String(
        dobDate.getMonth() + 1
      ).padStart(2, "0")}` === tomorrow
    );
  });

  return (
    <Layout>
      <div className="birthday-page">
        <h2>Today's and Tomorrow's Birthdays</h2>

        {/* TODAY BIRTHDAYS */}
        <div className="birthday-section today">
          <h3>
            Today's Birthdays:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
            ,{" "}
            {new Date().toLocaleDateString("en-GB", { weekday: "long" })}
          </h3>

          {todayBirthdays.length === 0 ? (
            <p>No birthdays today.</p>
          ) : (
            todayBirthdays.map((user) => (
              <div key={user.id} className="birthday-card">
                <div className="birthday-info">
                  <h3>{user.name}</h3>
                  <p>
                    DOB:{" "}
                    {new Date(user.dob).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p>Mobile: {user.phone}</p>
                  <p>MentOrbiter: HR Team</p>

                  {sentMessages.includes(user.id) ? (
                    <button
                      style={{ backgroundColor: "#16274f" }}
                      className="send-message-btn"
                    >
                      Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => sendWhatsAppMessage(user)}
                      className="send-message-btn"
                    >
                      Send
                    </button>
                  )}
                </div>

                {user.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="birthday-image top-right"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* TOMORROW BIRTHDAYS */}
        <div className="birthday-section tomorrow">
          <h3>
            Tomorrow's Birthdays:{" "}
            {new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
            ,{" "}
            {new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
              weekday: "long",
            })}
          </h3>

          {tomorrowBirthdays.length === 0 ? (
            <p>No birthdays tomorrow.</p>
          ) : (
            tomorrowBirthdays.map((user) => (
              <div key={user.id} className="birthday-card">
                <div className="birthday-info">
                  <h3>{user.name}</h3>
                  <p>
                    DOB:{" "}
                    {new Date(user.dob).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p>Mobile: {user.phone}</p>
                </div>

                {user.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="birthday-image top-right"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BirthdayPage;
