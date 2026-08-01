import { Routes, Route, useLocation } from "react-router-dom"
import Header from "./components/Header.jsx"
import Footer from "./components/Footer.jsx"
import WhatsAppButton from "./components/WhatsAppButton.jsx"
import ConnectionStatus from "./components/ConnectionStatus.jsx"
import { usePageView } from "./lib/usePageView"
import Home from "./pages/Home.jsx"
import Menu from "./pages/Menu.jsx"
import Booking from "./pages/Booking.jsx"
import Delivery from "./pages/Delivery.jsx"
import About from "./pages/About.jsx"
import Reviews from "./pages/Reviews.jsx"
import Contact from "./pages/Contact.jsx"
import TableMenu from "./pages/TableMenu.jsx"
import Account from "./pages/Account.jsx"
import Gallery from "./pages/Gallery.jsx"
import Events from "./pages/Events.jsx"
import Blog from "./pages/Blog.jsx"
import BlogPost from "./pages/BlogPost.jsx"
import OrderTracking from "./pages/OrderTracking.jsx"
import Payment from "./pages/Payment.jsx"
import AdminLayout from "./admin/AdminLayout.jsx"
import Login from "./admin/pages/Login.jsx"
import Dashboard from "./admin/pages/Dashboard.jsx"
import MenuManager from "./admin/pages/MenuManager.jsx"
import Reservations from "./admin/pages/Reservations.jsx"
import Orders from "./admin/pages/Orders.jsx"
import ContentEditor from "./admin/pages/ContentEditor.jsx"
import Translations from "./admin/pages/Translations.jsx"
import Tables from "./admin/pages/Tables.jsx"
import Accounting from "./admin/pages/Accounting.jsx"
import PromoCodes from "./admin/pages/PromoCodes.jsx"
import Kitchen from "./admin/pages/Kitchen.jsx"
import POS from "./admin/pages/POS.jsx"
import StaffManager from "./admin/pages/StaffManager.jsx"
import GalleryManager from "./admin/pages/GalleryManager.jsx"
import EventsManager from "./admin/pages/EventsManager.jsx"
import BlogManager from "./admin/pages/BlogManager.jsx"
import Customers from "./admin/pages/Customers.jsx"
import ContactMessages from "./admin/pages/ContactMessages.jsx"
import Analytics from "./admin/pages/Analytics.jsx"
import OrderConfirmation from "./admin/pages/OrderConfirmation.jsx"

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-bg text-ink">
            <Header />
            <Home />
            <Footer />
            <WhatsAppButton />
            <ConnectionStatus />
            <ViewLogger />
          </div>
        }
      />
      <Route path="/menu" element={<PublicPage><Menu /></PublicPage>} />
      <Route path="/reserver" element={<PublicPage><Booking /></PublicPage>} />
      <Route path="/livraison" element={<PublicPage><Delivery /></PublicPage>} />
      <Route path="/a-propos" element={<PublicPage><About /></PublicPage>} />
      <Route path="/avis" element={<PublicPage><Reviews /></PublicPage>} />
      <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
      <Route path="/galerie" element={<PublicPage><Gallery /></PublicPage>} />
      <Route path="/evenements" element={<PublicPage><Events /></PublicPage>} />
      <Route path="/blog" element={<PublicPage><Blog /></PublicPage>} />
      <Route path="/blog/:slug" element={<PublicPage><BlogPost /></PublicPage>} />

      {/* Page ouverte en scannant le QR code d une table */}
      <Route path="/table/:id" element={<TableMenu />} />

      {/* Compte client (login/inscription + tableau de bord) */}
      <Route path="/compte" element={<PublicPage><Account /></PublicPage>} />

      {/* Suivi de commande en direct, accessible sans compte via le lien recu */}
      <Route path="/suivi/:id" element={<PublicPage><OrderTracking /></PublicPage>} />
      <Route path="/paiement/:id" element={<PublicPage><Payment /></PublicPage>} />

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="menu" element={<MenuManager />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="commandes" element={<Orders />} />
        <Route path="tables" element={<Tables />} />
        <Route path="comptabilite" element={<Accounting />} />
        <Route path="codes-promo" element={<PromoCodes />} />
        <Route path="cuisine" element={<Kitchen />} />
        <Route path="pos" element={<POS />} />
        <Route path="clients" element={<Customers />} />
        <Route path="equipe" element={<StaffManager />} />
        <Route path="galerie" element={<GalleryManager />} />
        <Route path="evenements" element={<EventsManager />} />
        <Route path="blog" element={<BlogManager />} />
        <Route path="messages" element={<ContactMessages />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="confirmation" element={<OrderConfirmation />} />
        <Route path="contenu" element={<ContentEditor />} />
        <Route path="traductions" element={<Translations />} />
      </Route>
    </Routes>
  )
}

function PublicPage({ children }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header />
      {children}
      <Footer />
      <WhatsAppButton />
      <ConnectionStatus />
      <ViewLogger />
    </div>
  )
}

// Enregistre une vue de page a chaque changement de route publique
function ViewLogger() {
  const location = useLocation()
  usePageView(location.pathname)
  return null
}
