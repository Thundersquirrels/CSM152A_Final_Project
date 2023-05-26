import {defs, tiny} from './examples/common.js';
import {Body, Simulation, Test_Data} from './examples/collisions-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class Assignment3 extends Simulation {
    // ** Inertia_Demo** demonstration: This scene lets random initial momentums
    // carry several bodies until they fall due to gravity and bounce.
    constructor() {
        super();
	this.angle = 0.1;
        this.shapes = {
            cylinder: new defs.Capped_Cylinder(12, 12, [[0, 5], [0, 1]]),
            square: new defs.Square(),
            satsukiUmbrella: new Umbrella_Shape(8, 1.1),  // Custom shape for umbrella
            totoroUmbrella: new Umbrella_Shape(8, this.angle),  // Custom shape for umbrella
	    totoro: new Totoro(),
	    streetlamp: new Streetlamp(),
	    lightbulb: new defs.Subdivision_Sphere(4),
	    trees: [new Tree(), new Tree(), new Tree(), new Tree(), new Tree(), new Tree(), new Tree(), new Tree(), new Tree(), new Tree()],
        }
        const shader = new defs.Fake_Bump_Map(1);
        this.materials = {
	    test: new Material(shader, {color: color(.1, .9, .9, 1), ambient: .08, specularity: .3, diffusivity: 1, smoothness: 0.5}),
	    satsukiUmbrella: new Material(new defs.Phong_Shader(), {color: hex_color("#ff3080"), ambient: 0.05, specularity: 0.3, diffusivity: 0.7, smoothness: 0.8}),
	    totoroUmbrella: new Material(new defs.Phong_Shader(), {color: hex_color("#8020f0"), ambient: 0.05, specularity: 0.3, diffusivity: 0.7, smoothness: 0.8}),
	    totoro: new Material(new defs.Phong_Shader(), {color: hex_color("#808080"), ambient: 0.05, specularity: 0.3, diffusivity: 0.7, smoothness: 0.6}),
	    streetlamp: new Material(new defs.Phong_Shader(), {color: hex_color("#404040"), ambient: 0.08, specularity: 0.7, diffusivity: 1, smoothness: 0.4}),
	    lightbulb: new Material(new defs.Phong_Shader(), {color: color(1, 1, 1, 0.1), ambient: 0.08, specularity: 1, diffusivity: 1, smoothness: 1}),
	    tree: new Material(new defs.Phong_Shader(), {color: hex_color("#964b00"), ambient: 0.08, specularity: 0.3, diffusivity: 0.8, smoothness: 0.4}),
	}

	this.time = 0;

	this.scene = 1;
        this.camera_transform = Mat4.translation(0, 0, 0);
	this.totoroPos = 20;
	this.totoroUmbrellaPos = -4;
	this.lightOn = false;
    }

    update_state(dt) {
	this.time += dt;
        // update_state():  Override the base time-stepping code to say what this particular
        // scene should do to its bodies every frame -- including applying forces.
        // Generate additional moving bodies if there ever aren't enough:
        while (this.bodies.length < 50)
            this.bodies.push(new Body(this.shapes.cylinder, this.materials.test, vec3(0.2, 0.2, 0.2))
                .emplace(Mat4.translation(...vec3(0, 10, 0).randomized(40)),
                    vec3(0, -1, 0).randomized(2).normalized().times(3), Math.random()));

        for (let b of this.bodies) {
            // Gravity on Earth, where 1 unit in world space = 1 meter:
            b.linear_velocity[1] += dt * -9.8;
            // If about to fall through floor, reverse y velocity:
            if (b.center[1] < 0 && b.linear_velocity[1] < 0)
                b.linear_velocity[1] *= -.2;
        }
        // Delete bodies that stop or stray too far away:
        this.bodies = this.bodies.filter(b => b.center.norm() < 50 && b.linear_velocity.norm() > 3);

	if (this.time > 0 && this.time < 10) {
	    this.scene = 1;
	    this.camera_transform = Mat4.rotation(-1, 0, 1, 0).times(Mat4.translation(-5, -5, -5));
	}
	if (this.time > 10 && this.time < 20) {
	    this.lightOn = true;
	}
	if (this.time > 20 && this.time < 40) {
	    this.scene = 2;
	    this.camera_transform = Mat4.rotation(-1.6, 0, 1, 0).times(Mat4.translation(-15, -3, -2));
	}
	if (this.time > 40 && this.time < 80 && this.totoroPos > 0) {
	    this.totoroPos -= 0.05;
	    this.camera_transform = Mat4.translation(0, -2, -10).times(Mat4.rotation(0, 0, 1, 0));
	}
	if (this.time > 80 && this.angle <= 1.1) {
	    this.angle += 0.01;
	    this.shapes.totoroUmbrella = new Umbrella_Shape(8, this.angle);
	}
	if (this.time > 90) {
	    this.totoroUmbrellaPos += 0.05;
	}
	if (this.time > 93) {
	    this.totoroPos += 0.05;
	    this.camera_transform = Mat4.rotation(1.6, 0, 1, 0).times(Mat4.translation(15, -3, -5));
	}
    }

    display(context, program_state) {
        // display(): Draw everything else in the scene besides the moving bodies.
        super.display(context, program_state);
        const t = program_state.animation_time / 1000;

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            this.children.push(new defs.Program_State_Viewer());
        }
	program_state.set_camera(this.camera_transform);
	
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);
	program_state.lights = [new Light(vec4(1100, 5, 0, 1), color(1, 0.5, 1, 1), 1000000)];
	if (this.lightOn) {
            program_state.lights.push(new Light(vec4(-5, 6, -10, 1), color(1, 1, 0.7, 1), 500));
	}
        // Draw the ground:
        this.shapes.square.draw(context, program_state, Mat4.translation(0, 0, 0)
                .times(Mat4.rotation(Math.PI / 2, 1, 0, 0)).times(Mat4.scale(50, 50, 1)),
				this.materials.test.override(color(.1, .8, .6, 1)));

	// Draw satsuki's umbrella
	const satsuki_umbrella_transform = Mat4.translation(-2.5, 2, 0).times(Mat4.scale(1.4, 1.4, 1.4).times(Mat4.rotation(Math.PI/2, 1, 0, 0)));
	this.shapes.satsukiUmbrella.draw(context, program_state, satsuki_umbrella_transform, this.materials.satsukiUmbrella);
	// Draw totoro's umbrella
	const totoro_umbrella_transform = Mat4.translation(this.totoroUmbrellaPos, 2, 0).times(Mat4.scale(1.5, 1.5, 1.5).times(Mat4.rotation(Math.PI/2, 1, 0, 0)));
	this.shapes.totoroUmbrella.draw(context, program_state, totoro_umbrella_transform, this.materials.totoroUmbrella);
	// Draw totoro
	const totoro_transform = Mat4.translation(this.totoroPos, 1, 0).times(Mat4.scale(0.3, 0.3, 0.3));
	this.shapes.totoro.draw(context, program_state, totoro_transform, this.materials.totoro);
	// Draw street lamp and its lightbulb
	const streetlamp_transform = Mat4.translation(-5, 8, -2);
	const lightbulb_transform = Mat4.translation(-5, 7, -0.9).times(Mat4.scale(0.3, 0.3, 0.3));
	this.shapes.streetlamp.draw(context, program_state, streetlamp_transform, this.materials.streetlamp);
	this.shapes.lightbulb.draw(context, program_state, lightbulb_transform, this.materials.lightbulb);

	// Draw forest of trees
	this.shapes.trees[0].draw(context, program_state, Mat4.translation(5, 0, -5).times(Mat4.scale(0.6, 0.6, 0.6)), this.materials.tree);
	this.shapes.trees[1].draw(context, program_state, Mat4.translation(-4, 0, -16).times(Mat4.scale(0.6, 0.6, 0.6)), this.materials.tree);
	this.shapes.trees[2].draw(context, program_state, Mat4.translation(-10, 0, -10).times(Mat4.scale(1, 1, 1)), this.materials.tree);
	this.shapes.trees[3].draw(context, program_state, Mat4.translation(-15, 0, -8).times(Mat4.scale(0.8, 0.8, 0.8)), this.materials.tree);
	this.shapes.trees[4].draw(context, program_state, Mat4.translation(5, 0, 14).times(Mat4.scale(0.6, 0.6, 0.6)), this.materials.tree);
	this.shapes.trees[5].draw(context, program_state, Mat4.translation(-2, 0, 13).times(Mat4.scale(0.6, 0.6, 0.6)), this.materials.tree);
	this.shapes.trees[6].draw(context, program_state, Mat4.translation(-10, 0, 17).times(Mat4.scale(1, 1, 1)), this.materials.tree);
	this.shapes.trees[7].draw(context, program_state, Mat4.translation(10, 0, 15).times(Mat4.scale(0.8, 0.8, 0.8)), this.materials.tree);
	this.shapes.trees[8].draw(context, program_state, Mat4.translation(20, 0, -4).times(Mat4.scale(1, 1, 1)), this.materials.tree);
	this.shapes.trees[9].draw(context, program_state, Mat4.translation(20, 0, 15).times(Mat4.scale(0.8, 0.8, 0.8)), this.materials.tree);
    }
}

class Umbrella_Shape extends Shape {
    // Build a donut shape.  An example of a surface of revolution.
    constructor(sections, angle, texture_range=[[0, 1], [0, 1]]) {
        super("position", "normal", "texture_coord");
	const x = Math.sin(angle);
	const y = Math.cos(angle);
	// Top cover of umbrella
        defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [50, sections, [vec3(x, 0, y), vec3(x*0.95, 0, y*0.8), vec3(x*0.8, 0, y*0.5), vec3(x*0.5, 0, y*0.2), vec3(0, 0, 0)], texture_range]);
	// Middle stick of umbrella
	defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [3, 10, [vec3(0, 0, 0), vec3(0.02, 0, 0), vec3(0.02, 0, 1.1), vec3(0, 0, 1.1)], texture_range]);
	// Bottom handle of umbrella
	defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [10, 20, [vec3(0.2, 0, 0), vec3(0.165, 0, 0.015), vec3(0.15, 0, 0.05), vec3(0.165, 0, 0.085), vec3(0.2, 0, 0.1), vec3(0.235, 0, 0.085), vec3(0.25, 0, 0.05), vec3(0.235, 0, 0.015), vec3(0.2, 0, 0)], texture_range, Math.PI], Mat4.scale(0.6, 0.6, 0.75).times(Mat4.translation(0.2, 0.05, 1.43).times(Mat4.rotation(Math.PI/2, 1, 0, 0))));
    }
}

class Streetlamp extends Shape {
    constructor() {
	super("position", "normal", "texture_coord");
	// Lamp post
	defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [3, 10, [vec3(0, 0, 0), vec3(0.3, 0, 0), vec3(0.3, 0, 8), vec3(0, 0, 8)], [[0, 1], [0, 1]]], Mat4.translation(0, 0, 0).times(Mat4.rotation(Math.PI/2, 1, 0, 0)));
	// Cone around lightbulb
	defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [3, 10, [vec3(1, 0, 1), vec3(0.8, 0, 0.7), vec3(0.6, 0, 0.5), vec3(0.3, 0, 0.2), vec3(0, 0, 0)], [[0, 1], [0, 1]]], Mat4.translation(0, -0.4, 0.7).times(Mat4.rotation(1, 1, 0, 0)));
    }
}

class Tree extends Shape {
    constructor() {
	super("position", "normal", "texture_coord");
	// Tree trunk
	defs.Surface_Of_Revolution.insert_transformed_copy_into(this, [3, 10, [vec3(7, 0, 0), vec3(5, 0, 1.5), vec3(5, 0, 50), vec3(0, 0, 50)], [[0, 1], [0, 1]]], Mat4.translation(0, 0, 0).times(Mat4.rotation(-Math.PI/2, 1, 0, 0)));
    }
}

class Totoro extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");    
        //body
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.scale(3,4,3));
        //head
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.translation(0,3,0).times(Mat4.scale(2,2,2)));
        //ears
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.rotation(25,0,0,1).times(Mat4.translation(0,5,0).times(Mat4.scale(0.35,1.35,0.35))));
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], Mat4.rotation(-25,0,0,1).times(Mat4.translation(0,5,0).times(Mat4.scale(0.35,1.35,0.35))));
        const arm_scale = Mat4.scale(0.6, 2.5, 2);
        //left arm
        const left_arm_transform = Mat4.rotation(10,0,0,1).times(Mat4.translation(-3, 2, 0).times(arm_scale));
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], left_arm_transform);
        // right arm
        const right_arm_transform = Mat4.rotation(-10,0,0,1).times(Mat4.translation(3, 2, 0).times(arm_scale));
        defs.Subdivision_Sphere.insert_transformed_copy_into(this, [3], right_arm_transform);
    }
}

