## HDB resale infographic 


Use this app to easily filter and view up-to-date HDB resale prices!
![image](https://github.com/user-attachments/assets/77a47389-a039-4f89-a791-3dffa828ef9c)


## 🏠 Resale HDB Interactive Map
Resale HDB Interactive Map is a modern web application for visualizing and exploring Singapore HDB resale prices interactively on a map. Users can filter by flat type, lease, floor area, and more, and instantly see price trends and listing counts by region.

## 🚀 Tech Stack
Frontend: React (with TypeScript), Vite, D3.js, MapLibre GL JS
Styling/UI: Tailwind CSS, Mantine, Lucide Icons
Data Processing: Custom scripts, client-side filtering
Data Source: data.gov.sg HDB resale flat prices
Hosting: Netlify (static site)
Automation: GitHub Actions (for scheduled data updates)

## ✨ Features
Interactive map of Singapore with HDB town boundaries
Hover to see average price and number of listings per town
Filter by flat type, lease years, floor area, and storey range
Responsive design for desktop and mobile
Fast, client-side filtering for a smooth user experience
Data is updated automatically every 2 weeks via GitHub Actions

## 🔄 Data Update Workflow
All HDB resale data is fetched and stored as a static JSON file (public/propertyData.json).
A script (scripts/fetch_hdb_data.cjs) fetches and combines all records from data.gov.sg.
GitHub Actions runs this script every 2 weeks and on manual trigger, commits new data, and Netlify redeploys the site.
