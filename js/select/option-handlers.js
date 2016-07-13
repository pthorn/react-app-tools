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

    getSelectedIds(model, node) {
        // TODO val.id is hardcoded here
        return model.viewValue(node).map((subval) => subval.id);
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

    select(model, node, option) {
        const id_to_select = this.value(option);

        // model.viewValue(node) -> [{id: "foo"}, ...]
        // TODO id is hardcoded (NOT the same thing as opt.val!!!)
        if (_.some(model.viewValue(node), (opt) => opt.id === id_to_select)) {
            return;  // already selected
        }

        // TODO transaction
        // TODO more elegant
        // TODO id is hardcoded
        const new_subnode = model.add(node);
        model.setViewValue(new_subnode.children.id, id_to_select);
    }

    deselect(model, node, option) {
        const id_to_deselect = this.value(option);

        // TODO id is hardcoded
        model.filter(node, (subnode) =>
            model.viewValue(subnode.children.id) !== id_to_deselect);
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

    getSelectedIds(model, node) {
        // TODO val.id is hardcoded here
        return model.viewValue(node).map((subval) => subval);
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

    select(model, node, option) {
        //console.log('TagOptionHandler.select: option:', option);

        if (_.some(model.viewValue(node), (opt) => opt === option)) {
            return;  // already selected
        }

        const new_subnode = model.add(node);
        model.setViewValue(new_subnode, option);
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
