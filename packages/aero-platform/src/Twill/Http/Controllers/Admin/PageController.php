<?php

declare(strict_types=1);

namespace Aero\Platform\Twill\Http\Controllers\Admin;

use A17\Twill\Http\Controllers\Admin\ModuleController;
use A17\Twill\Models\Contracts\TwillModelContract;
use A17\Twill\Services\Forms\Fields\BlockEditor;
use A17\Twill\Services\Forms\Fields\Input;
use A17\Twill\Services\Forms\Fields\Medias;
use A17\Twill\Services\Forms\Fields\Select;
use A17\Twill\Services\Forms\Fields\Checkbox;
use A17\Twill\Services\Forms\Form;
use A17\Twill\Services\Listings\Columns\Text;
use A17\Twill\Services\Listings\Columns\Boolean;
use A17\Twill\Services\Listings\TableColumns;

class PageController extends ModuleController
{
    protected $moduleName = 'pages';

    protected $titleColumnKey = 'title';

    protected $titleFormKey = 'title';

    /**
     * Table columns shown in the listing view.
     */
    protected function additionalIndexTableColumns(): TableColumns
    {
        return TableColumns::make([
            Text::make()->field('title')->title('Title'),
            Boolean::make()->field('is_homepage')->title('Homepage'),
            Boolean::make()->field('published')->title('Published'),
        ]);
    }

    /**
     * The edit form fields.
     */
    public function getForm(TwillModelContract $model): Form
    {
        return Form::make([
            // SEO / Meta
            Input::make()->name('meta_title')->label('SEO Title')->translatable(),
            Input::make()->name('meta_description')->label('Meta Description')->translatable(),

            // Is this the site homepage?
            Checkbox::make()->name('is_homepage')->label('Set as Homepage'),

            // Cover image (OG)
            Medias::make()->name('cover')->label('Cover / OG Image'),

            // Block-based body content
            BlockEditor::make()->name('default'),
        ]);
    }
}
