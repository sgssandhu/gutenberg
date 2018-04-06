/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop, flatMap } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlock } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function BlockUnwrap( { blocks, small = false, onUnwrap, onClick = noop, isLocked, role } ) {
	if ( isLocked || blocks.some( ( { innerBlocks } ) => innerBlocks.length === 0 ) ) {
		return null;
	}

	const title = __( 'Unwrap Blocks' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ ( event ) => {
				onUnwrap( blocks );
				onClick( event );
			} }
			label={ small ? title : undefined }
			role={ role }
		>
			{ ! small && title }
		</IconButton>
	);
}
export default compose(
	connect(
		( state, ownProps ) => {
			return {
				blocks: ownProps.uids.map( ( uid ) => getBlock( state, uid ) ),
			};
		},
		( dispatch, ownProps ) => ( {
			onUnwrap( blocks ) {
				dispatch( replaceBlocks(
					ownProps.uids,
					flatMap( blocks, ( { innerBlocks } ) => innerBlocks ),
				) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockUnwrap );
