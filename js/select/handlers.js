const _ = require('lodash');
const S = require('string');


/**
 * options: [<option>, <option>, ...]
 * option: {label: '...', val: '...', children: <options>}
 */
export class HierarchicalOptionHandler {
    constructor(config) {
        this.config = config;
    }

    label(option) {
        return option[this.config.option_label_key];
    }

    value(option) {
        return option[this.config.option_value_key];
    }

    children(option) {
        return option[this.config.option_children_key];
    }

    hasChildren(option) {
        return _.isArray(this.children(option)) && this.children(option).length > 0;
    }

    getSelected(options, selected_option_ids) {
        const selected_options = [];

        const gather = (options) => {
            for (let opt of options) {
                if (_.includes(selected_option_ids, this.value(opt))) {
                    selected_options.push(opt);
                }

                if (this.hasChildren(opt)) {
                    gather(this.children(opt));
                }
            }
        };

        gather(options);

        return selected_options;
    }

    getFiltered(options, input_value, selected_option_ids) {
        if (!this.config.filter_options_by_user_input) {
            return options;
        }

        return _.filter(options, (opt) => this.label(opt) === input_value);
    }
}


export class TagOptionHandler {
    constructor(config) {
        this.config = config;
    }

    label(option) {
        return option;
    }

    value(option) {
        //console.log('TagOptionHandler.value: option:', option);
        return option;
    }

    hasChildren(option) {
        return false;
    }

    getSelected(options, selected_option_ids) {
        //console.log('TagOptionHandler.getSelected: option:', options, 'selected_option_ids', selected_option_ids);
        return selected_option_ids;
    }

    getFiltered(options, input_value, selected_option_ids) {  // TODO same as in OneLevel, inherit
        if (!this.config.filter_options_by_user_input) {
            return options;
        }

        return _.filter(options, (opt) => S(this.label(opt)).startsWith(input_value));
    }
}


/**
 * model: '...'
 */
export class SimpleIDModelHandler {
    constructor(config, option_handler) {
        this.config = config;
        this.opt_handler = option_handler;
    }

    getSelectedIds(model, node) {
        return model.viewValue(node);
    }

    select(model, node, option) {
        model.setViewValue(node, this.opt_handler.value(option));
    }

    deselect(model, node, option) {
        model.setViewValue(node, this.opt_handler.value(option));
    }
}


/**
 * model: ['...', ...]
 */
export class FlatListModelHandler {
    constructor(config, option_handler) {
        this.config = config;
        this.opt_handler = option_handler;
    }

    getSelectedIds(model, node) {
        return model.viewValue(node).map((subval) => subval);
    }

    select(model, node, option) {
        if (_.some(model.viewValue(node), (val) => val === this.opt_handler.value(option))) {
            return;  // already selected
        }

        const new_subnode = model.add(node);
        model.setViewValue(new_subnode, this.opt_handler.value(option));
    }

    addNew(model, node, option) {  // TODO exactly the same as select()
        //console.log('TagOptionHandler.addNew: option:', option);

        if (_.some(model.viewValue(node), (opt) => opt === option)) {
            return;  // already selected
        }

        const new_subnode = model.add(node);
        model.setViewValue(new_subnode, option);
    }

    deselect(model, node, option) {
        model.filter(node, (subnode) =>
            model.viewValue(subnode) !== option);
    }
}


/**
 * model: [{id: '...'}, ...]
 */
export class ObjectListModelHandler {
    constructor(config, option_handler) {
        this.config = config;
        this.opt_handler = option_handler;
    }

    getSelectedIds(model, node) {
        return model.viewValue(node).map((subval) => subval[this.config.model_id_key]);
    }

    select(model, node, option) {
        const id_to_select = this.opt_handler.value(option);

        // model.viewValue(node) -> [{id: "foo"}, ...]
        if (_.some(
                model.viewValue(node),
                (child) => child[this.config.model_id_key] === id_to_select)) {
            return;  // already selected
        }

        // TODO transaction
        // TODO more elegant
        const new_subnode = model.add(node);
        model.setViewValue(new_subnode.children[this.config.model_id_key], id_to_select);
    }

    deselect(model, node, option) {
        const id_to_deselect = this.opt_handler.value(option);

        model.filter(node, (subnode) =>
            model.viewValue(subnode.children[this.config.model_id_key]) !== id_to_deselect);
    }
}
