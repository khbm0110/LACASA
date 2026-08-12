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

/* Cinematic page transition — expo easing */
const pv = { initial:{opacity:0,y:16}, enter:{opacity:1,y:0}, exit:{opacity:0,y:-12} }
const pt = { type:"tween", ease:[0.16,1,0.3,1], duration:0.4 }
function PW({children}){ return <motion.div variants={pv} initial="initial" animate="enter" exit="exit" transition={pt}>{children}</motion.div> }

/* Public page wrapper with ambient background */
function PP({children}){ 
  return (
    <div className="min-h-screen bg-void text-pale font-body relative">
      <div className="ambient-bg"><div className="ambient-orb ambient-orb--gold" /><div className="ambient-orb ambient-orb--warm" /></div>
      <Header/>
      <div className="relative z-10">{children}</div>
      <Footer/>
      <WhatsAppButton/>
      <ConnectionStatus/>
      <VL/>
    </div>
  ) 
}
function VL(){ const l=useLocation(); usePageView(l.pathname); return null }

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PP><PW><Home/></PW></PP>} />
        <Route path="/menu" element={<PP><PW><Menu/></PW></PP>} />
        <Route path="/reserver" element={<PP><PW><Booking/></PW></PP>} />
        <Route path="/livraison" element={<PP><PW><Delivery/></PW></PP>} />
        <Route path="/a-propos" element={<PP><PW><About/></PW></PP>} />
        <Route path="/avis" element={<PP><PW><Reviews/></PW></PP>} />
        <Route path="/contact" element={<PP><PW><Contact/></PW></PP>} />
        <Route path="/galerie" element={<PP><PW><Gallery/></PW></PP>} />
        <Route path="/evenements" element={<PP><PW><Events/></PW></PP>} />
        <Route path="/blog" element={<PP><PW><Blog/></PW></PP>} />
        <Route path="/blog/:slug" element={<PP><PW><BlogPost/></PW></PP>} />
        <Route path="/table/:id" element={<TableMenu/>} />
        <Route path="/compte" element={<PP><PW><Account/></PW></PP>} />
        <Route path="/suivi/:id" element={<PP><PW><OrderTracking/></PW></PP>} />
        <Route path="/paiement/:id" element={<PP><PW><Payment/></PW></PP>} />
        <Route path="/admin/login" element={<Login/>} />
        <Route path="/admin" element={<AdminLayout/>}>
          <Route index element={<Dashboard/>}/>
          <Route path="menu" element={<MenuManager/>}/>
          <Route path="reservations" element={<Reservations/>}/>
          <Route path="commandes" element={<Orders/>}/>
          <Route path="tables" element={<Tables/>}/>
          <Route path="comptabilite" element={<Accounting/>}/>
          <Route path="codes-promo" element={<PromoCodes/>}/>
          <Route path="cuisine" element={<Kitchen/>}/>
          <Route path="pos" element={<POS/>}/>
          <Route path="inventaire" element={<InventoryItems/>}/>
          <Route path="fournisseurs" element={<Suppliers/>}/>
          <Route path="achats" element={<Purchases/>}/>
          <Route path="recettes" element={<Recipes/>}/>
          <Route path="modificateurs" element={<Modifiers/>}/>
          <Route path="formules" element={<Combos/>}/>
          <Route path="etablissements" element={<Branches/>}/>
          <Route path="ventes" element={<SalesHistory/>}/>
          <Route path="caisses" element={<Shifts/>}/>
          <Route path="rapports" element={<Reports/>}/>
          <Route path="clients" element={<Customers/>}/>
          <Route path="equipe" element={<StaffManager/>}/>
          <Route path="galerie" element={<GalleryManager/>}/>
          <Route path="evenements" element={<EventsManager/>}/>
          <Route path="blog" element={<BlogManager/>}/>
          <Route path="messages" element={<ContactMessages/>}/>
          <Route path="analytics" element={<Analytics/>}/>
          <Route path="confirmation" element={<OrderConfirmation/>}/>
          <Route path="contenu" element={<ContentEditor/>}/>
          <Route path="traductions" element={<Translations/>}/>
        </Route>
      </Routes>
    </AnimatePresence>
  )
}