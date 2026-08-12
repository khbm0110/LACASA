import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
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
import InventoryItems from "./admin/pages/InventoryItems.jsx"
import Suppliers from "./admin/pages/Suppliers.jsx"
import Purchases from "./admin/pages/Purchases.jsx"
import Recipes from "./admin/pages/Recipes.jsx"
import Modifiers from "./admin/pages/Modifiers.jsx"
import Combos from "./admin/pages/Combos.jsx"
import Branches from "./admin/pages/Branches.jsx"
import SalesHistory from "./admin/pages/SalesHistory.jsx"
import Shifts from "./admin/pages/Shifts.jsx"
import Reports from "./admin/pages/Reports.jsx"

// Page transition animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }
}
const pageTransition = { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.4 }

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith("/admin")

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-bg text-ink">
              <div className="grain" aria-hidden="true" />
              <Header />
              <PageWrapper><Home /></PageWrapper>
              <Footer />
              <WhatsAppButton />
              <ConnectionStatus />
              <ViewLogger />
            </div>
          }
        />
        <Route path="/menu" element={<PublicPage><PageWrapper><Menu /></PageWrapper></PublicPage>} />
        <Route path="/reserver" element={<PublicPage><PageWrapper><Booking /></PageWrapper></PublicPage>} />
        <Route path="/livraison" element={<PublicPage><PageWrapper><Delivery /></PageWrapper></PublicPage>} />
        <Route path="/a-propos" element={<PublicPage><PageWrapper><About /></PageWrapper></PublicPage>} />
        <Route path="/avis" element={<PublicPage><PageWrapper><Reviews /></PageWrapper></PublicPage>} />
        <Route path="/contact" element={<PublicPage><PageWrapper><Contact /></PageWrapper></PublicPage>} />
        <Route path="/galerie" element={<PublicPage><PageWrapper><Gallery /></PageWrapper></PublicPage>} />
        <Route path="/evenements" element={<PublicPage><PageWrapper><Events /></PageWrapper></PublicPage>} />
        <Route path="/blog" element={<PublicPage><PageWrapper><Blog /></PageWrapper></PublicPage>} />
        <Route path="/blog/:slug" element={<PublicPage><PageWrapper><BlogPost /></PageWrapper></PublicPage>} />
        <Route path="/table/:id" element={<TableMenu />} />
        <Route path="/compte" element={<PublicPage><PageWrapper><Account /></PageWrapper></PublicPage>} />
        <Route path="/suivi/:id" element={<PublicPage><PageWrapper><OrderTracking /></PageWrapper></PublicPage>} />
        <Route path="/paiement/:id" element={<PublicPage><PageWrapper><Payment /></PageWrapper></PublicPage>} />
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
          <Route path="inventaire" element={<InventoryItems />} />
          <Route path="fournisseurs" element={<Suppliers />} />
          <Route path="achats" element={<Purchases />} />
          <Route path="recettes" element={<Recipes />} />
          <Route path="modificateurs" element={<Modifiers />} />
          <Route path="formules" element={<Combos />} />
          <Route path="etablissements" element={<Branches />} />
          <Route path="ventes" element={<SalesHistory />} />
          <Route path="caisses" element={<Shifts />} />
          <Route path="rapports" element={<Reports />} />
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
    </AnimatePresence>
  )
}

function PublicPage({ children }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <div className="grain" aria-hidden="true" />
      <Header />
      {children}
      <Footer />
      <WhatsAppButton />
      <ConnectionStatus />
      <ViewLogger />
    </div>
  )
}

function ViewLogger() {
  const location = useLocation()
  usePageView(location.pathname)
  return null
}
