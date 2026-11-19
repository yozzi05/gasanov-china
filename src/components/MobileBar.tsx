import { site, whatsappLink } from "@/content/site";
import { TelegramIcon, WhatsAppIcon } from "./icons";

// Закреплённая панель на телефоне: связь всегда под большим пальцем.
export function MobileBar() {
  return (
    <nav className="mobile-bar" aria-label="Быстрая связь">
      <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="h-5 w-5" />
        WhatsApp
      </a>
      <a href={site.contacts.telegram} target="_blank" rel="noopener noreferrer">
        <TelegramIcon className="h-5 w-5" />
        Telegram
      </a>
      <a href="#calc" data-primary>
        Рассчитать
      </a>
    </nav>
  );
}
