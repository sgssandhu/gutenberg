/**
 * External dependencies
 */
import classnames from 'classnames';
import ResizableBox from 're-resizable';
import {
	get,
	isEmpty,
	map,
	pick,
	startCase,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment, compose } from '@wordpress/element';
import { getBlobByURL, revokeBlobURL, viewPort } from '@wordpress/utils';
import {
	Button,
	ButtonGroup,
	IconButton,
	PanelBody,
	SelectControl,
	TextControl,
	Toolbar,
	withContext,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import RichText from '../../rich-text';
import ImagePlaceholder from '../../image-placeholder';
import MediaUpload from '../../media-upload';
import InspectorControls from '../../inspector-controls';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import UrlInputButton from '../../url-input/button';
import ImageSize from './image-size';
import { mediaUpload } from '../../../utils/mediaupload';

/**
 * Module constants
 */
const MIN_SIZE = 20;

class ImageBlock extends Component {
	constructor() {
		super( ...arguments );
		this.updateAlt = this.updateAlt.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.onFocusCaption = this.onFocusCaption.bind( this );
		this.onImageClick = this.onImageClick.bind( this );
		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSetHref = this.onSetHref.bind( this );
		this.updateImageURL = this.updateImageURL.bind( this );

		this.state = {
			captionFocused: false,
		};
	}

	componentDidMount() {
		const { attributes, setAttributes } = this.props;
		const { id, url = '' } = attributes;

		if ( ! id && url.indexOf( 'blob:' ) === 0 ) {
			getBlobByURL( url )
				.then(
					( file ) =>
						mediaUpload(
							[ file ],
							( [ image ] ) => {
								setAttributes( { ...image } );
							},
							'image'
						)
				);
		}
	}

	componentDidUpdate( prevProps ) {
		const { id: prevID, url: prevUrl = '' } = prevProps.attributes;
		const { id, url = '' } = this.props.attributes;

		if ( ! prevID && prevUrl.indexOf( 'blob:' ) === 0 && id && url.indexOf( 'blob:' ) === -1 ) {
			revokeBlobURL( url );
		}
	}

	componentWillReceiveProps( { isSelected } ) {
		if ( ! isSelected && this.props.isSelected && this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	onSelectImage( media ) {
		this.props.setAttributes( pick( media, [ 'alt', 'id', 'caption', 'url' ] ) );
	}

	onSetHref( value ) {
		this.props.setAttributes( { href: value } );
	}

	onFocusCaption() {
		if ( ! this.state.captionFocused ) {
			this.setState( {
				captionFocused: true,
			} );
		}
	}

	onImageClick() {
		if ( this.state.captionFocused ) {
			this.setState( {
				captionFocused: false,
			} );
		}
	}

	updateAlt( newAlt ) {
		this.props.setAttributes( { alt: newAlt } );
	}

	updateAlignment( nextAlign ) {
		const extraUpdatedAttributes = [ 'wide', 'full' ].indexOf( nextAlign ) !== -1 ?
			{ width: undefined, height: undefined } :
			{};
		this.props.setAttributes( { ...extraUpdatedAttributes, align: nextAlign } );
	}

	updateImageURL( url ) {
		this.props.setAttributes( { url, width: undefined, height: undefined } );
	}

	getAvailableSizes() {
		return get( this.props.image, [ 'media_details', 'sizes' ], {} );
	}

	renderBlockControls() {
		const { attributes, isSelected } = this.props;
		const { align, id, href } = attributes;

		if ( ! isSelected ) {
			return null;
		}

		return (
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ this.updateAlignment }
				/>

				<Toolbar>
					<MediaUpload
						onSelect={ this.onSelectImage }
						type="image"
						value={ id }
						render={ ( { open } ) => (
							<IconButton
								className="components-toolbar__control"
								label={ __( 'Edit image' ) }
								icon="edit"
								onClick={ open }
							/>
						) }
					/>
					<UrlInputButton onChange={ this.onSetHref } url={ href } />
				</Toolbar>
			</BlockControls>
		);
	}

	renderInspectorControls( { imageWidthWithinContainer, imageHeightWithinContainer } ) {
		const { attributes, isSelected, setAttributes } = this.props;
		const { alt, url, width, height } = attributes;

		if ( ! isSelected ) {
			return null;
		}

		const availableSizes = this.getAvailableSizes();

		return (
			<InspectorControls key="inspector">
				<PanelBody title={ __( 'Image Settings' ) }>
					<TextControl
						label={ __( 'Textual Alternative' ) }
						value={ alt }
						onChange={ this.updateAlt }
						help={ __( 'Describe the purpose of the image. Leave empty if the image is not a key part of the content.' ) }
					/>
					{ ! isEmpty( availableSizes ) && (
						<SelectControl
							label={ __( 'Source Type' ) }
							value={ url }
							options={ map( availableSizes, ( size, name ) => ( {
								value: size.source_url,
								label: startCase( name ),
							} ) ) }
							onChange={ this.updateImageURL }
						/>
					) }
					{ imageWidthWithinContainer && imageHeightWithinContainer && (
						<div className="blocks-image-dimensions">
							<div className="blocks-image-dimensions__row">
								<TextControl
									type="number"
									className="blocks-image-dimensions__width"
									label={ __( 'Width' ) }
									value={ width !== undefined ? width : '' }
									placeholder={ Math.round( imageWidthWithinContainer ) }
									onChange={ ( value ) => {
										setAttributes( { width: parseInt( value, 10 ) } );
									} }
								/>
								<TextControl
									type="number"
									className="blocks-image-dimensions__height"
									label={ __( 'Height' ) }
									value={ height !== undefined ? height : '' }
									placeholder={ Math.round( imageHeightWithinContainer ) }
									onChange={ ( value ) => {
										setAttributes( { height: parseInt( value, 10 ) } );
									} }
								/>
							</div>
							<div className="blocks-image-dimensions__row">
								<ButtonGroup aria-label={ __( 'Image Size' ) }>
									{ [ 25, 50, 75, 100 ].map( ( scale ) => {
										const scaledWidth = Math.round( imageWidthWithinContainer * ( scale / 100 ) );
										const scaledHeight = Math.round( imageHeightWithinContainer * ( scale / 100 ) );

										const isCurrent = width === scaledWidth && height === scaledHeight;

										return (
											<Button
												key={ scale }
												isSmall
												isPrimary={ isCurrent }
												aria-pressed={ isCurrent }
												onClick={ () => {
													setAttributes( { width: scaledWidth, height: scaledHeight } );
												} }
											>
												{ scale }%
											</Button>
										);
									} ) }
								</ButtonGroup>
								<Button
									isSmall
									onClick={ () => {
										setAttributes( { width: undefined, height: undefined } );
									} }
								>
									{ __( 'Reset' ) }
								</Button>
							</div>
						</div>
					) }
				</PanelBody>
			</InspectorControls>
		);
	}

	renderImage( { imageWidthWithinContainer, imageHeightWithinContainer, imageWidth, imageHeight } ) {
		const { attributes, settings, toggleSelection, setAttributes } = this.props;
		const { align, url, alt, width, height } = attributes;

		const isResizable = [ 'wide', 'full' ].indexOf( align ) === -1 && ( ! viewPort.isExtraSmall() );

		// Disable reason: Image itself is not meant to be interactive, but should direct focus to block
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
		const img = <img src={ url } alt={ alt } onClick={ this.onImageClick } />;

		if ( ! isResizable || ! imageWidthWithinContainer ) {
			return img;
		}

		const currentWidth = width || imageWidthWithinContainer;
		const currentHeight = height || imageHeightWithinContainer;

		const ratio = imageWidth / imageHeight;
		const minWidth = imageWidth < imageHeight ? MIN_SIZE : MIN_SIZE * ratio;
		const minHeight = imageHeight < imageWidth ? MIN_SIZE : MIN_SIZE / ratio;

		return (
			<ResizableBox
				size={ {
					width: currentWidth,
					height: currentHeight,
				} }
				minWidth={ minWidth }
				maxWidth={ settings.maxWidth }
				minHeight={ minHeight }
				maxHeight={ settings.maxWidth / ratio }
				lockAspectRatio
				handleClasses={ {
					topRight: 'wp-block-image__resize-handler-top-right',
					bottomRight: 'wp-block-image__resize-handler-bottom-right',
					topLeft: 'wp-block-image__resize-handler-top-left',
					bottomLeft: 'wp-block-image__resize-handler-bottom-left',
				} }
				enable={ {
					top: false,
					right: true,
					bottom: false,
					left: false,
					topRight: true,
					bottomRight: true,
					bottomLeft: true,
					topLeft: true,
				} }
				onResizeStart={ () => {
					toggleSelection( false );
				} }
				onResizeStop={ ( event, direction, elt, delta ) => {
					setAttributes( {
						width: parseInt( currentWidth + delta.width, 10 ),
						height: parseInt( currentHeight + delta.height, 10 ),
					} );
					toggleSelection( true );
				} }
			>
				{ img }
			</ResizableBox>
		);
	}

	render() {
		const { attributes, setAttributes, isSelected, className } = this.props;
		const { url, caption, align, width } = attributes;

		if ( ! url ) {
			return (
				<Fragment>
					{ this.renderBlockControls() }
					<ImagePlaceholder
						className={ className }
						key="image-placeholder"
						icon="format-image"
						label={ __( 'Image' ) }
						onSelectImage={ this.onSelectImage }
					/>
				</Fragment>
			);
		}

		const classes = classnames( className, {
			'is-transient': 0 === url.indexOf( 'blob:' ),
			'is-resized': !! width,
			'is-focused': isSelected,
		} );

		const figureStyle = width ? { width } : {};

		return (
			<ImageSize src={ url } dirtynessTrigger={ align }>
				{ ( sizes ) => {
					return (
						<Fragment>
							{ this.renderBlockControls() }
							{ this.renderInspectorControls( sizes ) }
							<figure key="image" className={ classes } style={ figureStyle }>
								{ this.renderImage( sizes ) }
								{ ( caption && caption.length > 0 ) || isSelected ? (
									<RichText
										tagName="figcaption"
										placeholder={ __( 'Write caption…' ) }
										value={ caption }
										onFocus={ this.onFocusCaption }
										onChange={ ( value ) => setAttributes( { caption: value } ) }
										isSelected={ this.state.captionFocused }
										inlineToolbar
									/>
								) : null }
							</figure>
						</Fragment>
					);
				} }
			</ImageSize>
		);
	}
}

export default compose( [
	withContext( 'editor' )( ( settings ) => {
		return { settings };
	} ),
	withSelect( ( select, props ) => {
		const { getMedia } = select( 'core' );
		const { id } = props.attributes;

		return {
			image: id ? getMedia( id ) : null,
		};
	} ),
] )( ImageBlock );
