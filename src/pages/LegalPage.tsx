export function LegalPage({ mode }: { mode: 'mentions' | 'privacy' }) {
  return (
    <div className="bg-[#EFE9DF]/40 py-16 lg:py-24 px-5 sm:px-8 lg:px-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#073D37]/12 p-8 sm:p-12 space-y-6 shadow-[0_20px_50px_-24px_rgba(7,61,55,0.08)]">
        {mode === 'mentions' ? (
          <>
            <h1 className="font-display font-bold text-3xl text-[#073D37] tracking-tight">Mentions légales</h1>
            <div className="space-y-4 text-sm text-[#1A1A1A]/80 leading-relaxed">
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Éditeur du site
                </h2>
                <p className="mt-1">
                  <strong>4EVER Madagascar</strong> — modern handcraft
                  <br />
                  Showroom 4EVER — Ampandrana, Antananarivo, Madagascar
                  <br />
                  Téléphone : 038 32 664 11
                  <br />
                  E-mail : commercial4ever@gmail.com
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Propriété intellectuelle
                </h2>
                <p className="mt-1">
                  Les marques, logos, motifs géométriques, visuels et contenus textuels présentés sur ce site appartiennent à 4EVER Madagascar. Toute reproduction ou modification sans autorisation écrite préalable est interdite.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Tarifs et devis
                </h2>
                <p className="mt-1">
                  Les articles présentés dans le catalogue interactif font l&apos;objet d&apos;une étude personnalisée et sont proposés sur devis en fonction des quantités, matières et techniques de personnalisation retenues.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display font-bold text-3xl text-[#073D37]">
              Politique de confidentialité
            </h1>
            <div className="space-y-4 text-sm text-[#172824]/80 leading-relaxed">
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Collecte des données
                </h2>
                <p className="mt-1">
                  Les informations recueillies via les formulaires de demande de devis et de contact (nom, entreprise, e-mail, téléphone/WhatsApp, fichiers joints et description du projet) sont utilisées exclusivement par 4EVER Madagascar pour répondre à votre demande commerciale.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Stockage local temporaire
                </h2>
                <p className="mt-1">
                  Votre sélection multiproduit pour devis est mémorisée localement dans votre navigateur afin de conserver vos articles lors de la navigation. Aucune donnée bancaire n&apos;est collectée sur ce site.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Services cartographiques Google Maps
                </h2>
                <p className="mt-1">
                  La page Contact intègre la cartographie Google Maps Platform pour localiser le Showroom 4EVER d&apos;Ampandrana. L&apos;utilisation de cette fonctionnalité est soumise aux Conditions d&apos;utilisation supplémentaires de Google Maps et à la Politique de confidentialité de Google.
                </p>
              </div>
              <div>
                <h2 className="font-display font-semibold text-base text-[#073D37]">
                  Vos droits
                </h2>
                <p className="mt-1">
                  Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données transmises en écrivant à commercial4ever@gmail.com.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
