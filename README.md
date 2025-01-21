**VeeServe: Service Provider Management System**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


Welcome to VeeServe, a robust service provider management system inspired by platforms like UrbanClap. Our system is designed to streamline the process of connecting customers with high-quality services, backed by a dedicated team of in-house service professionals.

**Images**

**Customer**

**Home Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/21fe424a-c56c-4d16-9a56-c85dae3b8a74">

**Login Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/bb95e20b-6f70-49ba-9c5b-9f85ff3aaa42">

**Cart Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/2d54b978-4c58-4a13-9d73-7c5c3e6f512d">

**Admin**

**Login Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/fe312053-eba7-4689-b899-498ebeb5eb26">

**Home Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/1919f692-8411-48e9-8dd4-2dd2b22ba02c">

**Service Agent**

**Home Page**
<img width="1470" alt="image" src="https://github.com/Megh-Shah-2901/VeeServe/assets/86917130/90f7fb35-25b3-4129-a46f-da1ed3ab497c">


**Overview:**

VeeServe offers a full range of services directly to customers by managing a team of professional service providers. Unlike marketplaces, we ensure consistent quality and reliability by employing service providers as part of our team. Our unique algorithm automates the assignment of service providers to jobs based on availability, ensuring a smooth operation that scales with demand.

**Features:**

Automated Assignment Algorithm: Assignments are made by an intelligent system that considers availability, service type, and scheduling to match service providers with customer needs.

Customer Feedback System: A built-in feedback mechanism allows for continuous improvement and customer engagement.

Robust Scheduling: Customers can book services according to their convenience, with the system managing service provider time slots effectively.

**Tech Stack:**

Backend: Node.js with Express framework, providing a scalable and flexible server structure.

Database: MongoDB, offering a powerful document database that handles diverse data types and is designed for scalability.

Frontend: EJS (Embedded JavaScript templating), allowing for fast server-side rendering of HTML with embedded JavaScript.

Version Control: Git, with hosting on GitHub for collaborative development and issue tracking.

**Getting Started:**

To get started with VeeServe on your local machine, follow these steps:

**Clone the Repository**

git clone https://github.com/Megh-Shah-2901/VeeServe.git

cd VeeServe

Install Dependencies

**For the backend (root directory):**

cd admin_module
npm install

cd customer_module
npm install

cd serviceAgent_module
npm install

**Database Configuration**

Replace the MongoDB connection string with your own in the server files. If you're using a service like MongoDB Atlas, ensure that your IP is whitelisted.

**Start the Server**

**Customer Side Solution**

node app.js

**Admin Side Solution**

node admin_app.js

**Service Provide Side Solution**

node SA_app.js

**For development, you may want to run:**

npm run dev

**Usage:**

The system is accessed through a web interface where customers can browse services and make bookings. For service providers, there is a dashboard for managing their schedules and receiving assignment notifications.

**Contribution**

Professionals willing to contribute can check the issues tab for reported bugs and feature requests. Please ensure to follow the code of conduct and submit pull requests for review.

**License**

VeeServe is licensed under the MIT License. See the LICENSE file for more details.

**Acknowledgements**

Node.js community for continuous support and contributions.

MongoDB documentation for providing comprehensive guides.

#opensource #nodejs #expressjs #ecommerce #mern #serviceindusty
