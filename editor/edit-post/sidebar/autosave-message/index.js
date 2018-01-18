/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAutosaveMessage } from '../../../store/selectors';

function AutosaveMessage( { message } ) {
	if ( ! message ) {
		return null;
	}
	return (
		<PanelRow>
			<span>{ __( 'Autosave' ) }</span>
			<div>{ message }</div>
		</PanelRow>
	);
}

export default connect(
	( state ) => {
		return {
			message: getAutosaveMessage( state ),
		};
	}
)( AutosaveMessage );