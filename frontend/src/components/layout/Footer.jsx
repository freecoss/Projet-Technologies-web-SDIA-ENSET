export function Footer() {
  return (
    <footer className="w-full border-t border-bch7al-darkgray/10 bg-white py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-bch7al-darkgray font-medium">
          &copy; {new Date().getFullYear()} bch7al. Tous droits réservés. <br/>
          <span className="opacity-70 font-normal">Comparateur de prix collaboratif.</span>
        </p>
      </div>
    </footer>
  )
}
