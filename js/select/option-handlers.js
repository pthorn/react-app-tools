const _ = require('lodash');


export class OneLevelOptionHandler {
    label(option) {
        return option.label;
    }

    value(option) {
        return option.val;
    }

    getSelectedIds(model, node) {
        // TODO val.id is hardcoded here
        return model.viewValue(node).map((subval) => subval.id);
    }

    getSelected(options, selected_option_ids) {
        return _.filter(options, (opt) =>
            _.includes(selected_option_ids, this.value(opt)));
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

export class TwoLevelOptionHandler extends OneLevelOptionHandler {
    getSelected(options, selected_option_ids) {
        const selected_options = [];

        for (let opts of options) {
            for (let opt of opts.options) {
                if (_.includes(selected_option_ids, this.value(opt))) {
                    selected_options.push(opt);
                }
            }
        }

        return selected_options;
    }
}

export class TagOptionHandler {
    label(option) {
        return option;
    }

    value(option) {
        //console.log('TagOptionHandler.value: option:', option);
        return option;
    }

    getSelectedIds(model, node) {
        // TODO val.id is hardcoded here
        return model.viewValue(node).map((subval) => subval);
    }

    getSelected(options, selected_option_ids) {
        //console.log('TagOptionHandler.getSelected: option:', options, 'selected_option_ids', selected_option_ids);
        return selected_option_ids;
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
