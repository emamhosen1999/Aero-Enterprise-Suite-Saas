<?php

namespace Aero\Cms\Database\Seeders;

use Aero\Cms\Models\CmsPage;
use Aero\Cms\Models\CmsCategory;
use Illuminate\Database\Seeder;

class MultilingualPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a category for testing
        $category = CmsCategory::firstOrCreate(
            ['slug' => 'documentation'],
            [
                'name' => 'Documentation',
                'description' => 'CMS Documentation pages in multiple languages',
            ]
        );

        // Create multilingual "About Us" pages
        $aboutPages = [
            [
                'lang' => 'en',
                'slug' => 'about-us',
                'title' => 'About Us',
                'content' => 'Learn more about Aero Enterprise Suite - the complete ERP solution for modern businesses.',
                'description' => 'About Aero Enterprise Suite',
            ],
            [
                'lang' => 'es',
                'slug' => 'acerca-de',
                'title' => 'Acerca de Nosotros',
                'content' => 'Conozca más sobre Aero Enterprise Suite - la solución ERP completa para empresas modernas.',
                'description' => 'Acerca de Aero Enterprise Suite',
            ],
            [
                'lang' => 'fr',
                'slug' => 'a-propos',
                'title' => 'À Propos',
                'content' => 'En savoir plus sur Aero Enterprise Suite - la solution ERP complète pour les entreprises modernes.',
                'description' => 'À Propos d\'Aero Enterprise Suite',
            ],
            [
                'lang' => 'de',
                'slug' => 'uber-uns',
                'title' => 'Über Uns',
                'content' => 'Erfahren Sie mehr über Aero Enterprise Suite - die komplette ERP-Lösung für moderne Unternehmen.',
                'description' => 'Über Aero Enterprise Suite',
            ],
        ];

        foreach ($aboutPages as $pageData) {
            CmsPage::firstOrCreate(
                [
                    'slug' => $pageData['slug'],
                    'language' => $pageData['lang'],
                    'translation_key' => 'about-us',
                ],
                [
                    'title' => $pageData['title'],
                    'content' => $pageData['content'],
                    'meta_title' => $pageData['title'],
                    'meta_description' => $pageData['description'],
                    'status' => 'published',
                    'language' => $pageData['lang'],
                    'translation_key' => 'about-us',
                    'cms_category_id' => $category->id,
                    'allow_indexing' => true,
                    'is_homepage' => false,
                ]
            );
        }

        // Create multilingual "Getting Started" pages
        $gettingStartedPages = [
            [
                'lang' => 'en',
                'slug' => 'getting-started',
                'title' => 'Getting Started',
                'content' => 'Get started with Aero Enterprise Suite in just a few minutes. Follow our comprehensive guide to set up your account and explore all features.',
                'description' => 'Getting Started with Aero',
            ],
            [
                'lang' => 'es',
                'slug' => 'comenzar',
                'title' => 'Cómo Comenzar',
                'content' => 'Comience con Aero Enterprise Suite en solo unos minutos. Siga nuestra guía completa para configurar su cuenta y explorar todas las características.',
                'description' => 'Cómo Comenzar con Aero',
            ],
            [
                'lang' => 'fr',
                'slug' => 'bien-demarrer',
                'title' => 'Bien Démarrer',
                'content' => 'Commencez avec Aero Enterprise Suite en quelques minutes seulement. Suivez notre guide complet pour configurer votre compte et explorer toutes les fonctionnalités.',
                'description' => 'Bien Démarrer avec Aero',
            ],
        ];

        foreach ($gettingStartedPages as $pageData) {
            CmsPage::firstOrCreate(
                [
                    'slug' => $pageData['slug'],
                    'language' => $pageData['lang'],
                    'translation_key' => 'getting-started',
                ],
                [
                    'title' => $pageData['title'],
                    'content' => $pageData['content'],
                    'meta_title' => $pageData['title'],
                    'meta_description' => $pageData['description'],
                    'status' => 'published',
                    'language' => $pageData['lang'],
                    'translation_key' => 'getting-started',
                    'cms_category_id' => $category->id,
                    'allow_indexing' => true,
                    'is_homepage' => false,
                ]
            );
        }

        $this->command->info('Multilingual CMS pages seeded successfully!');
    }
}
