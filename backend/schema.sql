PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE composants (
id_composant INTEGER PRIMARY KEY AUTOINCREMENT,
nom TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    categorie TEXT,
    quantite INTEGER DEFAULT 0,
    emplacement TEXT,
    prix REAL,
    photo_url TEXT
);
CREATE TABLE projets (
id_projet INTEGER PRIMARY KEY AUTOINCREMENT,
nom TEXT NOT NULL,
budget_alloue REAL,
budget_consomme REAL DEFAULT 0,
statut TEXT CHECK(statut IN ('actif', 'archive')) DEFAULT 'actif'
);
INSERT INTO projets VALUES(1,'Tri plateau repas',NULL,0.0,'actif');
INSERT INTO projets VALUES(2,'Smart Totem',NULL,0.0,'actif');
INSERT INTO projets VALUES(3,'UveTibi',NULL,0.0,'actif');
INSERT INTO projets VALUES(4,'Scanner NO2',NULL,0.0,'actif');
CREATE TABLE bom_lignes (
    projet_id INTEGER,
    composant_id INTEGER,
    qte_requise INTEGER,
    cout_estime REAL,
FOREIGN KEY (projet_id) REFERENCES projets(id_projet),
FOREIGN KEY (composant_id) REFERENCES composants(id_composant)
);
CREATE TABLE mouvements_stock (
    move_id INTEGER PRIMARY KEY AUTOINCREMENT,
    composant_id INTEGER,
    type_mouvement TEXT CHECK(type_mouvement IN ('ENTREE', 'SORTIE', 'AJUSTEMENT')),
    quantite INTEGER,
    date_mvt DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT, -- Pour noter "Proto Scanner NO2" ou "Perte"
    FOREIGN KEY (composant_id) REFERENCES composants(id_composant)
);
PRAGMA writable_schema=ON;
CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('projets',4);
PRAGMA writable_schema=OFF;
COMMIT;
